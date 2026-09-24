---
"@eventuras/historia": patch
---

When Vipps Login is not enabled (`VIPPS_LOGIN_ENABLED` is not `true`), the `/api/auth/vipps/*` routes answer 404 instead of failing with a 500, and the admin login page no longer shows the Vipps button.
