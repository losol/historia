/**
 * The default client: plain OpenID Connect through fides-auth, with discovery,
 * PKCE and the userinfo endpoint. It is enough for Keycloak and most providers;
 * one that needs extra headers brings its own `OidcClient`.
 */

import {
  buildAuthorizationUrl,
  buildPKCEOptions,
  exchangeAuthorizationCode,
  type OAuthConfig,
} from '@eventuras/fides-auth/oauth';
import { discoverConfiguration } from '@eventuras/fides-auth/oidc-discovery';
import * as openid from 'openid-client';
import { createLogger } from './logger';
import type { OidcClient, OidcUserInfo, ResolvedOidcProvider } from './types';

const logger = createLogger('OidcClient');

/** The subject the ID token names, without verifying it again: openid-client already did. */
function subjectOf(idToken: string | undefined): string | undefined {
  const payload = idToken?.split('.')[1];
  if (!payload) return undefined;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof claims.sub === 'string' ? claims.sub : undefined;
  } catch {
    return undefined;
  }
}

export function createOidcClient<TUser extends OidcUserInfo>(
  provider: ResolvedOidcProvider<TUser>,
  redirectUri: string,
): OidcClient<TUser> {
  const oauthConfig: OAuthConfig = {
    issuer: provider.issuer,
    clientId: provider.clientId,
    clientSecret: provider.clientSecret,
    redirect_uri: redirectUri,
    scope: provider.scope,
  };

  return {
    buildPKCEOptions: () => buildPKCEOptions(oauthConfig),

    async buildAuthorizationUrl(pkce) {
      const config = await discoverConfiguration(oauthConfig);
      return buildAuthorizationUrl(config, pkce);
    },

    exchangeCodeForTokens: (callbackUrl, codeVerifier, expectedState) =>
      exchangeAuthorizationCode(oauthConfig, callbackUrl, codeVerifier, expectedState),

    async getUserInfo(tokens) {
      if (!tokens.access_token) {
        throw new Error('The token response has no access token');
      }
      const config = await discoverConfiguration(oauthConfig);
      // The ID token names the subject; the userinfo answer must be about the same one.
      const sub = subjectOf(tokens.id_token);
      const userInfo = await openid.fetchUserInfo(
        config,
        tokens.access_token,
        sub ?? openid.skipSubjectCheck,
      );
      logger.debug(
        { provider: provider.name, sub: userInfo.sub, hasEmail: !!userInfo.email },
        'Fetched user info',
      );
      return userInfo as unknown as TUser;
    },
  };
}
