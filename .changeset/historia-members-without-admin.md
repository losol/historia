---
'@eventuras/historia': minor
---

Logging in no longer opens the admin by itself: only system admins and users with a role on a website can use it. Anyone else who logs in, such as a person who signed up through the identity provider, is a member of the public site. That makes `OIDC_ALLOW_SIGNUP=true` safe to leave on. A login from the admin's button now also comes back to the deep link the person was trying to open. See `docs/OIDC_LOGIN_SETUP.md`.
