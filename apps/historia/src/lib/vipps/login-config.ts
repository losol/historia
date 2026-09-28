import { resolveApiUrl } from '@eventuras/vipps/vipps-core';

/**
 * Vipps Login settings from the environment, shared by the auth plugin and the
 * login/callback routes so they cannot drift apart.
 *
 * The environment comes from VIPPS_API_URL, the same variable the payments
 * client uses. Vipps Login's OIDC issuer is that URL plus
 * `/access-management-1.0/access/`, so a separate VIPPS_LOGIN_ENVIRONMENT only
 * created a second way to say the same thing — and a second way to get it
 * wrong.
 *
 * Missing credentials come back as '' rather than being asserted non-null:
 * resolveConfig() in @eventuras/payload-vipps-auth rejects an empty client ID or
 * secret with a clear error, and the plugin only resolves them when enabled.
 */
export function getVippsLoginEnv() {
  return {
    enabled: process.env.VIPPS_LOGIN_ENABLED === 'true',
    apiUrl: resolveApiUrl(process.env.VIPPS_API_URL),
    clientId: process.env.VIPPS_LOGIN_CLIENT_ID ?? '',
    clientSecret: process.env.VIPPS_LOGIN_CLIENT_SECRET ?? '',
  };
}
