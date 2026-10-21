---
'@eventuras/historia': minor
---

Vipps Login goes through `@eventuras/payload-oidc-auth`, which serves the login routes as Payload endpoints and matches users by their Vipps subject (the new `identities` field on users). An email Vipps has not verified no longer links to an existing user. Ready for more identity providers.
