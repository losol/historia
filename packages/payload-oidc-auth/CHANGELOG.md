# @eventuras/payload-oidc-auth

## 0.1.1

### Patch Changes

- 5123449: The `identities` field refuses writes from anyone but the plugin itself: it was read-only in the admin only, so a user who could update their own document could clear or change their identities over the API. The plugin's own writes go through the local API with access overridden, so nothing changes for logins.

## 0.1.0

### Minor Changes

- e161801: New package: OpenID Connect login for Payload CMS, with one plugin for any number of providers. Each provider gets `/api/auth/{name}/login`, `/callback` and `/session` as Payload endpoints and an auth strategy. Users are matched by the provider's subject through an `identities` field the plugin adds, then by an email the provider reports as verified; an unverified email no longer links to an existing account.
