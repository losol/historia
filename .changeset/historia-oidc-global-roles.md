---
'@eventuras/historia': minor
---

With `OIDC_SYSTEM_ADMIN_ROLE` set, the OIDC provider (Keycloak) is the source of the global roles: every login through it sets `roles` from its claims, so a user with the named role is a system admin and one without it is not, whatever was granted by hand. The roles of such users are read-only in the admin, and a first user the provider creates no longer becomes a system admin by being first (one created with a password still does). `OIDC_ROLES_CLAIM` says where the roles are in the userinfo (default `realm_access.roles`). See `docs/OIDC_LOGIN_SETUP.md`.
