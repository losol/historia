/**
 * OpenID Connect login for Payload CMS.
 *
 * One plugin, any number of providers: each gets login, callback and session
 * endpoints under `/api/auth/{name}` and an auth strategy, and users are matched
 * by the provider's subject through the `identities` field the plugin adds.
 *
 * @see https://payloadcms.com/docs/authentication/custom-strategies
 */

export * from './handlers';
export { createOidcClient } from './oidc-client';
export { getPublicRequestOrigin } from './origin';
export { oidcAuthPlugin, oidcEndpoints } from './plugin';
export { DEFAULT_SCOPE, resolveConfig, resolveProvider, strategyName } from './provider';
export { createOidcAuthStrategy } from './strategy';
export * from './types';
export { findOrCreateUser, IDENTITIES_FIELD, identitiesField, OidcLoginFailure } from './users';
