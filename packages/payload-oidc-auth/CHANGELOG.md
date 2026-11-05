# @eventuras/payload-oidc-auth

## 0.2.0

### Minor Changes

- d14bf2c: A login can come back to the page that started it: `/api/auth/{name}/login?returnTo=<path>` ends on that path instead of `successPath`. Only a path on the same site is accepted, and not one under the provider's own routes, so it is not an open redirect; it is checked at the login, the callback and the session route. `OidcLoginButton` takes a `returnTo` prop and otherwise passes on Payload's `?redirect=` deep link. `safeReturnPath` and `RETURN_TO_PARAM` are exported.

## 0.1.1

### Patch Changes

- 5123449: The `identities` field refuses writes from anyone but the plugin itself: it was read-only in the admin only, so a user who could update their own document could clear or change their identities over the API. The plugin's own writes go through the local API with access overridden, so nothing changes for logins.

## 0.1.0

### Minor Changes

- e161801: New package: OpenID Connect login for Payload CMS, with one plugin for any number of providers. Each provider gets `/api/auth/{name}/login`, `/callback` and `/session` as Payload endpoints and an auth strategy. Users are matched by the provider's subject through an `identities` field the plugin adds, then by an email the provider reports as verified; an unverified email no longer links to an existing account.
