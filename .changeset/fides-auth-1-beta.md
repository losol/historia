---
'@eventuras/historia': patch
'@eventuras/payload-oidc-auth': minor
'@eventuras/payload-vipps-auth': patch
---

`@eventuras/fides-auth` 1.0.0-beta.6, pinned to that version. Login through an identity provider now runs on its `createOidcClient`, one client per redirect URI so a provider is discovered once and not for every login. A provider on `http://localhost` works in development.

`OidcClient`, the contract a provider with its own client implements, follows the new names: `createAuthorizationRequest`, `authorizationUrl` and `exchangeCode(callbackUrl, { codeVerifier, state })` replace `buildPKCEOptions`, `buildAuthorizationUrl` and `exchangeCodeForTokens`.

The cart cookie is Historia's own again: fides-auth 1.0 only makes a session out of a login, so `@eventuras/fides-auth-next` is gone from the app. The cookie keeps its name, format and lifetime, and carts in browsers today still open. A cookie written from now on also expires inside, after the 30 days its browser keeps it.
