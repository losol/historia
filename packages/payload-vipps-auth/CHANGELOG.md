# @eventuras/payload-vipps-auth

## 0.3.5

### Patch Changes

- 77ceb1d: `@eventuras/fides-auth` 1.0.0-beta.11. A login with `openid` in the scope now sends a nonce, and the callback checks that the ID token carries it, so an ID token from another login is refused. The nonce is kept in a handshake cookie next to the PKCE verifier, and `OidcClient.exchangeCode` gets it with the verifier and state: a provider with a client of its own passes it on to fides-auth.
- 970ce79: `@eventuras/fides-auth` 1.0.0-beta.9. Vipps login now checks that the userinfo answer is about the person the ID token names, as the default client already did, and refuses a redirect from the Vipps userinfo endpoint. `idTokenSubject` from `payload-oidc-auth` reads that person off a token response, for a provider with a client of its own.
- e8f786c: `@eventuras/fides-auth` 1.0.0-beta.6, pinned to that version. Login through an identity provider now runs on its `createOidcClient`, one client per redirect URI so a provider is discovered once and not for every login. A provider on `http://localhost` works in development.
  
  `OidcClient`, the contract a provider with its own client implements, follows the new names: `createAuthorizationRequest`, `authorizationUrl` and `exchangeCode(callbackUrl, { codeVerifier, state })` replace `buildPKCEOptions`, `buildAuthorizationUrl` and `exchangeCodeForTokens`.
  
  The cart cookie is Historia's own again: fides-auth 1.0 only makes a session out of a login, so `@eventuras/fides-auth-next` is gone from the app. The cookie keeps its name, format and lifetime, and carts in browsers today still open. A cookie written from now on also expires inside, after the 30 days its browser keeps it.
- Updated dependencies [77ceb1d]
- Updated dependencies [970ce79]
- Updated dependencies [e8f786c]
  - @eventuras/payload-oidc-auth@0.3.0

## 0.3.4

### Patch Changes

- Updated dependencies [d607b94]
  - @eventuras/vipps@0.3.1

## 0.3.3

### Patch Changes

- Updated dependencies [52b8fe8]
  - @eventuras/vipps@0.3.0

## 0.3.2

### Patch Changes

- Updated dependencies [d14bf2c]
  - @eventuras/payload-oidc-auth@0.2.0

## 0.3.1

### Patch Changes

- Updated dependencies [5123449]
  - @eventuras/payload-oidc-auth@0.1.1

## 0.3.0

### Minor Changes

- e161801: Vipps Login is now a provider for `@eventuras/payload-oidc-auth`: `vippsProvider(config)` replaces `vippsAuthPlugin`, the handlers and the strategy, which live in the generic package. The routes, cookies and user mapping are unchanged. Requires the `oidcAuthPlugin` in the Payload config.

### Patch Changes

- Updated dependencies [e161801]
  - @eventuras/payload-oidc-auth@0.1.0

## 0.2.1

### Patch Changes

- Updated dependencies [063c396]
- Updated dependencies [fe0d986]
  - @eventuras/vipps@0.2.11

## 0.2.0

### Minor Changes

- d2fe77a: Vipps Login no longer replaces a user's addresses. Only the address labelled "Vipps" is updated (or added if missing); addresses the user added themselves are kept. `mapVippsUser` now receives the existing user as a second argument, so mappers can merge instead of overwrite.

## 0.1.11

### Patch Changes

- Updated dependencies [7bcf252]
  - @eventuras/fides-auth@0.9.0
  - @eventuras/vipps@0.2.10

## 0.1.10

### Patch Changes

- Updated dependencies [2fed638]
  - @eventuras/fides-auth@0.8.0
  - @eventuras/vipps@0.2.9

## 0.1.9

### Patch Changes

- Updated dependencies [3796814]
  - @eventuras/fides-auth@0.7.1
  - @eventuras/vipps@0.2.8

## 0.1.8

### Patch Changes

- Updated dependencies [22c3761]
- Updated dependencies [a29b507]
  - @eventuras/fides-auth@0.7.0
  - @eventuras/logger@0.8.1
  - @eventuras/vipps@0.2.7

## 0.1.7

### Patch Changes

- Updated dependencies [7caaea2]
  - @eventuras/fides-auth@0.6.0
  - @eventuras/vipps@0.2.6

## 0.1.6

### Patch Changes

- Updated dependencies [0783155]
  - @eventuras/fides-auth@0.5.0
  - @eventuras/vipps@0.2.5

## 0.1.5

### Patch Changes

- Updated dependencies [ea5bb15]
- Updated dependencies [7d2b896]
- Updated dependencies [fc1f5dc]
  - @eventuras/fides-auth@0.4.0
  - @eventuras/logger@0.8.0
  - @eventuras/vipps@0.2.4

## 0.1.4

### Patch Changes

- 7c9fe79: chore: update dependencies
- Updated dependencies [7c9fe79]
  - @eventuras/fides-auth@0.3.1
  - @eventuras/logger@0.7.1
  - @eventuras/vipps@0.2.3

## 0.1.3

### Patch Changes

- Updated dependencies [6e7d2d4]
  - @eventuras/logger@0.7.0
  - @eventuras/vipps@0.2.2

## 0.1.2

### Patch Changes

- Updated dependencies [d752b18]
  - @eventuras/fides-auth@0.3.0
  - @eventuras/vipps@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @eventuras/logger@0.6.0
  - @eventuras/vipps@0.2.0
  - @eventuras/fides-auth@0.2.1
