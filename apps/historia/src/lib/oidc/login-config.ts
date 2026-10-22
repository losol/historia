/**
 * Settings for logging in through an OpenID Connect provider such as Keycloak
 * (Tessera), read from the environment. The provider itself is deployment
 * configuration: the same build serves staging and production with different
 * realms, or none.
 *
 * Shared by the provider in plugins.ts and the button on the admin login, so
 * they cannot drift apart. Missing credentials come back as '' rather than being
 * asserted non-null: oidcAuthPlugin rejects an empty issuer, client ID or secret
 * with a clear error, and only looks at them when enabled.
 */
export function getOidcLoginEnv() {
  return {
    enabled: process.env.OIDC_LOGIN_ENABLED === 'true',
    issuer: process.env.OIDC_ISSUER ?? '',
    clientId: process.env.OIDC_CLIENT_ID ?? '',
    clientSecret: process.env.OIDC_CLIENT_SECRET ?? '',
    // Whether a person the provider vouches for, but who has no user yet, gets
    // one. A new user has no roles, so this grants nothing by itself.
    allowSignup: process.env.OIDC_ALLOW_SIGNUP !== 'false',
    label: process.env.OIDC_LOGIN_LABEL || 'Logg inn',
  };
}
