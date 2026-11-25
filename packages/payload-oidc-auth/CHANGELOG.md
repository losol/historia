# @eventuras/payload-oidc-auth

## 0.3.0

### Minor Changes

- e8f786c: `@eventuras/fides-auth` 1.0.0-beta.6, pinned to that version. Login through an identity provider now runs on its `createOidcClient`, one client per redirect URI so a provider is discovered once and not for every login. A provider on `http://localhost` works in development.
  
  `OidcClient`, the contract a provider with its own client implements, follows the new names: `createAuthorizationRequest`, `authorizationUrl` and `exchangeCode(callbackUrl, { codeVerifier, state })` replace `buildPKCEOptions`, `buildAuthorizationUrl` and `exchangeCodeForTokens`.
  
  The cart cookie is Historia's own again: fides-auth 1.0 only makes a session out of a login, so `@eventuras/fides-auth-next` is gone from the app. The cookie keeps its name, format and lifetime, and carts in browsers today still open. A cookie written from now on also expires inside, after the 30 days its browser keeps it.

### Patch Changes

- 77ceb1d: `@eventuras/fides-auth` 1.0.0-beta.11. A login with `openid` in the scope now sends a nonce, and the callback checks that the ID token carries it, so an ID token from another login is refused. The nonce is kept in a handshake cookie next to the PKCE verifier, and `OidcClient.exchangeCode` gets it with the verifier and state: a provider with a client of its own passes it on to fides-auth.
- 970ce79: `@eventuras/fides-auth` 1.0.0-beta.9. Vipps login now checks that the userinfo answer is about the person the ID token names, as the default client already did, and refuses a redirect from the Vipps userinfo endpoint. `idTokenSubject` from `payload-oidc-auth` reads that person off a token response, for a provider with a client of its own.

## 0.2.0

### Minor Changes

- d14bf2c: A login can come back to the page that started it: `/api/auth/{name}/login?returnTo=<path>` ends on that path instead of `successPath`. Only a path on the same site is accepted, and not one under the provider's own routes, so it is not an open redirect; it is checked at the login, the callback and the session route. `OidcLoginButton` takes a `returnTo` prop and otherwise passes on Payload's `?redirect=` deep link. `safeReturnPath` and `RETURN_TO_PARAM` are exported.

## 0.1.1

### Patch Changes

- 5123449: The `identities` field refuses writes from anyone but the plugin itself: it was read-only in the admin only, so a user who could update their own document could clear or change their identities over the API. The plugin's own writes go through the local API with access overridden, so nothing changes for logins.

## 0.1.0

### Minor Changes

- e161801: New package: OpenID Connect login for Payload CMS, with one plugin for any number of providers. Each provider gets `/api/auth/{name}/login`, `/callback` and `/session` as Payload endpoints and an auth strategy. Users are matched by the provider's subject through an `identities` field the plugin adds, then by an email the provider reports as verified; an unverified email no longer links to an existing account.
