/**
 * Settings for logging in through an OpenID Connect provider such as Keycloak
 * (Tessera), read from the environment. The provider itself is deployment
 * configuration: the same build serves staging and production with different
 * realms, or none.
 *
 * Shared by the provider in plugins.ts, the button on the admin login and the
 * Users collection, so they cannot drift apart. Missing credentials come back as
 * '' rather than being asserted non-null: oidcAuthPlugin rejects an empty issuer,
 * client ID or secret with a clear error, and only looks at them when enabled.
 */
export function getOidcLoginEnv() {
  const enabled = process.env.OIDC_LOGIN_ENABLED === 'true';
  const systemAdminRole = process.env.OIDC_SYSTEM_ADMIN_ROLE ?? '';
  return {
    enabled,
    issuer: process.env.OIDC_ISSUER ?? '',
    clientId: process.env.OIDC_CLIENT_ID ?? '',
    clientSecret: process.env.OIDC_CLIENT_SECRET ?? '',
    // Whether a person the provider vouches for, but who has no user yet, gets
    // one. A new user has no roles, so this grants nothing by itself.
    allowSignup: process.env.OIDC_ALLOW_SIGNUP !== 'false',
    label: process.env.OIDC_LOGIN_LABEL || 'Logg inn',
    // The provider's role that makes a user a system admin. When set, the
    // provider is authoritative for the global roles: every login sets them from
    // its claims, so a role it does not send is taken away. Empty: roles are
    // granted by hand in the admin, as before.
    systemAdminRole,
    // Where in the userinfo the roles are, as a dotted path. Keycloak puts realm
    // roles under realm_access.roles and client roles under
    // resource_access.<client id>.roles.
    rolesClaim: process.env.OIDC_ROLES_CLAIM || 'realm_access.roles',
    // Both the login and the role have to be on for the provider to be the source
    // of the global roles; with either off, nothing would ever grant them.
    rolesSynced: enabled && systemAdminRole !== '',
  };
}
