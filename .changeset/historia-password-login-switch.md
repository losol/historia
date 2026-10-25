---
'@eventuras/historia': minor
---

`PASSWORD_LOGIN_ENABLED=false` makes an identity provider the only way into the admin: the login page loses the email and password form, and login, forgot password and reset password answer 403 over REST and GraphQL. Sessions and API keys are unaffected. Ignored, with an error logged, unless OIDC or Vipps login is on. Setting it back to `true` is the break-glass; see `docs/OIDC_LOGIN_SETUP.md`.
