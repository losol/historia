---
'@eventuras/historia': patch
'@eventuras/payload-oidc-auth': patch
'@eventuras/payload-vipps-auth': patch
---

`@eventuras/fides-auth` 1.0.0-beta.8. Vipps login now checks that the userinfo answer is about the person the ID token names, as the default client already did, and refuses a redirect from the Vipps userinfo endpoint. `idTokenSubject` from `payload-oidc-auth` reads that person off a token response, for a provider with a client of its own.
