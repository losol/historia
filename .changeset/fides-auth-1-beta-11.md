---
'@eventuras/historia': patch
'@eventuras/payload-oidc-auth': patch
'@eventuras/payload-vipps-auth': patch
---

`@eventuras/fides-auth` 1.0.0-beta.11. A login with `openid` in the scope now sends a nonce, and the callback checks that the ID token carries it, so an ID token from another login is refused. The nonce is kept in a handshake cookie next to the PKCE verifier, and `OidcClient.exchangeCode` gets it with the verifier and state: a provider with a client of its own passes it on to fides-auth.
