---
'@eventuras/payload-vipps-auth': minor
---

Vipps Login is now a provider for `@eventuras/payload-oidc-auth`: `vippsProvider(config)` replaces `vippsAuthPlugin`, the handlers and the strategy, which live in the generic package. The routes, cookies and user mapping are unchanged. Requires the `oidcAuthPlugin` in the Payload config.
