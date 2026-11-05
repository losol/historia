---
'@eventuras/payload-oidc-auth': minor
---

A login can come back to the page that started it: `/api/auth/{name}/login?returnTo=<path>` ends on that path instead of `successPath`. Only a path on the same site is accepted, and not one under the provider's own routes, so it is not an open redirect; it is checked at the login, the callback and the session route. `OidcLoginButton` takes a `returnTo` prop and otherwise passes on Payload's `?redirect=` deep link. `safeReturnPath` and `RETURN_TO_PARAM` are exported.
