/**
 * Vipps Login as a provider for `oidcAuthPlugin`.
 *
 * Vipps is plain OIDC except for its userinfo endpoint, which wants the
 * subscription key and merchant serial number as headers. `VippsLoginClient`
 * from fides-auth knows that, so it is the provider's client.
 */

import {
  getVippsIssuer,
  VippsLoginClient,
  type VippsUserInfo,
} from '@eventuras/fides-auth/providers/vipps';
import type { OidcClient, OidcProvider } from '@eventuras/payload-oidc-auth';
import { resolveApiUrl } from '@eventuras/vipps/vipps-core';
import type { VippsProviderConfig } from './types';

export const VIPPS_PROVIDER_NAME = 'vipps';

export const DEFAULT_VIPPS_SCOPE = 'openid name phoneNumber address email';

/** The standard claims, with the phone number Vipps always verifies. */
function defaultMapVippsUser(vippsUser: VippsUserInfo): Record<string, unknown> {
  return {
    email: vippsUser.email,
    email_verified: vippsUser.email_verified,
    given_name: vippsUser.given_name,
    family_name: vippsUser.family_name,
    phone_number: vippsUser.phone_number,
    phone_number_verified: vippsUser.phone_number_verified,
  };
}

export function vippsProvider(config: VippsProviderConfig): OidcProvider<VippsUserInfo> {
  // The same URL the payments client uses; resolveApiUrl applies the test
  // default and strips a trailing slash, which matters because getVippsIssuer
  // builds the issuer as `${apiUrl}/access-management-1.0/access/`.
  const apiUrl = resolveApiUrl(config.apiUrl);
  const scope = config.scope ?? DEFAULT_VIPPS_SCOPE;

  return {
    name: VIPPS_PROVIDER_NAME,
    label: 'Vipps',
    issuer: getVippsIssuer(apiUrl),
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    scope,
    redirectUri: config.redirectUri,
    basePath: config.basePath,
    allowSignup: config.allowSignup,
    requireVerifiedEmail: config.requireVerifiedEmail,
    mapUser: config.mapVippsUser ?? defaultMapVippsUser,

    createClient(provider, redirectUri): OidcClient<VippsUserInfo> {
      const client = new VippsLoginClient({
        issuer: provider.issuer,
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        redirectUri,
        scope: provider.scope,
        subscriptionKey: config.subscriptionKey,
        merchantSerialNumber: config.merchantSerialNumber,
      });
      return {
        buildPKCEOptions: () => client.buildPKCEOptions(),
        buildAuthorizationUrl: (pkce) => client.buildAuthorizationUrl(pkce),
        exchangeCodeForTokens: (callbackUrl, codeVerifier, expectedState) =>
          client.exchangeCodeForTokens(callbackUrl, codeVerifier, expectedState),
        getUserInfo(tokens) {
          if (!tokens.access_token) throw new Error('The token response has no access token');
          return client.getUserInfo(tokens.access_token);
        },
      };
    },
  };
}
