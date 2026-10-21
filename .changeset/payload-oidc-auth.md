---
'@eventuras/payload-oidc-auth': minor
---

New package: OpenID Connect login for Payload CMS, with one plugin for any number of providers. Each provider gets `/api/auth/{name}/login`, `/callback` and `/session` as Payload endpoints and an auth strategy. Users are matched by the provider's subject through an `identities` field the plugin adds, then by an email the provider reports as verified; an unverified email no longer links to an existing account.
