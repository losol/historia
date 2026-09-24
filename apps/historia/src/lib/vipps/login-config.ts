/**
 * Vipps Login settings from the environment, shared by the auth plugin and the
 * login/callback routes so they cannot drift apart.
 *
 * Missing credentials come back as '' rather than being asserted non-null:
 * resolveConfig() in @eventuras/payload-vipps-auth rejects an empty client ID or
 * secret with a clear error, and the plugin only resolves them when enabled.
 */
export function getVippsLoginEnv() {
  return {
    enabled: process.env.VIPPS_LOGIN_ENABLED === 'true',
    environment:
      process.env.VIPPS_LOGIN_ENVIRONMENT === 'production'
        ? ('production' as const)
        : ('test' as const),
    clientId: process.env.VIPPS_LOGIN_CLIENT_ID ?? '',
    clientSecret: process.env.VIPPS_LOGIN_CLIENT_SECRET ?? '',
  };
}
