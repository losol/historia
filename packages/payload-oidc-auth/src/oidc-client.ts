/**
 * The default client: plain OpenID Connect through fides-auth, with discovery,
 * PKCE and the userinfo endpoint. It is enough for Keycloak and most providers;
 * one that needs extra headers brings its own `OidcClient`.
 */

import { createOidcClient as createFidesOidcClient } from '@eventuras/fides-auth/oidc';
import { Logger } from '@eventuras/logger';
import { createLogger } from './logger';
import type { OidcClient, OidcUserInfo, ResolvedOidcProvider } from './types';

const logger = createLogger('OidcClient');

/**
 * The subject the ID token of a token response names. It is not verified again:
 * the token response came straight from the provider's token endpoint, and
 * openid-client checked its ID token there. For a provider's own client, to
 * check its userinfo answer against.
 */
export function idTokenSubject(idToken: string | undefined): string | undefined {
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
  // fides-auth only lets http through to a loopback address, so this opens a
  // provider on localhost in development and nothing else.
  const allowInsecureRequests = provider.issuer.startsWith('http://');

  // The client keeps the provider's discovery document, so it is made once per
  // redirect URI (see `clientFor`) and not for every request.
  const oidc = createFidesOidcClient(
    {
      issuer: provider.issuer,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      redirectUri,
      scope: provider.scope,
      allowInsecureRequests,
    },
    // Without a logger fides-auth writes its own JSON lines to the console.
    { logger: Logger },
  );

  return {
    createAuthorizationRequest: () => oidc.createAuthorizationRequest(),

    authorizationUrl: (request) => oidc.authorizationUrl(request),

    exchangeCode: (callbackUrl, request) => oidc.exchangeCode(callbackUrl, request),

    async getUserInfo(tokens) {
      if (!tokens.access_token) {
        throw new Error('The token response has no access token');
      }
      // The ID token names the subject; the userinfo answer must be about the
      // same one, and fides-auth refuses to ask without it. With `openid` in
      // the scope a provider always sends an ID token.
      const sub = idTokenSubject(tokens.id_token);
      if (!sub) {
        throw new Error('The token response has no ID token to name the user');
      }
      const userInfo = await oidc.userInfo(tokens.access_token, { expectedSubject: sub });
      logger.debug(
        { provider: provider.name, sub: userInfo.sub, hasEmail: !!userInfo.email },
        'Fetched user info',
      );
      return userInfo as unknown as TUser;
    },
  };
}

const clients = new WeakMap<object, Map<string, OidcClient<never>>>();

/**
 * The provider's client for one redirect URI, made once and kept. A site served
 * on several hosts has a redirect URI for each, and each gets its own client:
 * the redirect URI is part of a fides-auth client's configuration.
 */
export function clientFor<TUser extends OidcUserInfo>(
  provider: ResolvedOidcProvider<TUser>,
  redirectUri: string,
): OidcClient<TUser> {
  let byRedirectUri = clients.get(provider);
  if (!byRedirectUri) {
    byRedirectUri = new Map();
    clients.set(provider, byRedirectUri);
  }
  let client = byRedirectUri.get(redirectUri) as OidcClient<TUser> | undefined;
  if (!client) {
    client = provider.createClient(provider, redirectUri);
    byRedirectUri.set(redirectUri, client as OidcClient<never>);
  }
  return client;
}
