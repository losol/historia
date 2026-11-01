# OpenID Connect login (Keycloak / Tessera)

Historia can log people in through any OpenID Connect provider. The provider is
deployment configuration, so staging and production can use different realms, or
none. Vipps Login is a separate provider with its own settings; see
[VIPPS_LOGIN_SETUP.md](VIPPS_LOGIN_SETUP.md).

## Step 1: Register a client with the provider

In Keycloak, under the realm Historia should use, create a confidential client
(client authentication on, standard flow, PKCE S256). Add a redirect URI for every
domain Historia serves:

```text
<public origin>/api/auth/oidc/callback
```

Note the client ID and secret.

## Step 2: Configure Historia

```bash
# Exactly 'true'; anything else leaves the login off (routes answer 404, no button).
OIDC_LOGIN_ENABLED=true

# The issuer: where .well-known/openid-configuration is found.
OIDC_ISSUER=https://idp.example.com/realms/example
OIDC_CLIENT_ID=historia
OIDC_CLIENT_SECRET=...

# 'false' lets only people who already have a user in (default: true).
OIDC_ALLOW_SIGNUP=true

# The button on the admin login (default: "Logg inn").
OIDC_LOGIN_LABEL=Logg inn med Tessera

# The provider's role that makes a user a system admin. Set, the provider is the
# source of the global roles; see "Global roles from the provider" below.
OIDC_SYSTEM_ADMIN_ROLE=historia-admin
# Where the roles are in the userinfo (default: realm_access.roles).
OIDC_ROLES_CLAIM=realm_access.roles
```

`CMS_ALLOWED_ORIGINS` must list the public origins, as for Vipps: it is what
makes a forwarded host trusted when the redirect URI is built behind a proxy.

## OIDC only: turning off email and password login

Where the provider manages the editors, `PASSWORD_LOGIN_ENABLED=false` makes it
the only way into the admin:

- `/admin/login` shows the provider button(s) and no email and password form, so
  no "forgot password" either.
- Login, forgot password and reset password answer 403, over REST
  (`/api/users/login`, `/forgot-password`, `/reset-password`) and GraphQL alike.
- Sessions, API keys, `/api/users/me` and logout work as before.

The setting is ignored, with an error in the log, unless `OIDC_LOGIN_ENABLED` or
`VIPPS_LOGIN_ENABLED` is `true`; otherwise nobody could log in. The first user on
an empty install is created with a password through `/admin/create-first-user`
whatever the setting, and the first user to log in through the provider becomes a
system admin as well, so an empty install needs no password step. With
`OIDC_SYSTEM_ADMIN_ROLE` set, the provider decides instead: see "Global roles
from the provider".

**Break-glass.** When the provider is down, set `PASSWORD_LOGIN_ENABLED=true` and
restart. Existing users keep their passwords, so the form works at once. Keep one
account for this: its own email, not linked to a provider identity, with a strong
password in the password manager. Every other password is live again while the
flag is on, so passwords set by hand before the switch are worth rotating.

## How users are matched

The same rules as for Vipps: a returning person is found by the provider's
subject (the `identities` field on the user); otherwise the email finds an
existing user and links the identity, or creates a user, but only when the
provider reports the email as verified (`email_verified`). An unverified email
is refused (`?error=email_not_verified`) and never written to a user.

With `OIDC_ALLOW_SIGNUP=false`, a person without a user is refused
(`?error=signup_disabled`).

A new user has no roles and no tenant access until an admin grants it, unless
the provider is the source of the global roles (next section).

## Global roles from the provider

With `OIDC_SYSTEM_ADMIN_ROLE` set, the provider is authoritative for the global
`roles` field: every login through it sets the field from the provider's claims.
A person with the named role becomes a system admin; a person without it is not
one, even if someone granted the role by hand, and someone who loses the role at
the provider loses it in Historia on their next login. The roles of a user who
has logged in through the provider are read-only in the admin for the same
reason: a change there would be undone at the next login.

What this does and does not cover:

- Only the global roles. Tenant membership and site roles are still granted in
  the admin.
- Only logins through this provider. A Vipps login leaves the roles alone, and so
  does a password login, so a break-glass account that has never logged in
  through the provider keeps the roles it has.
- A missing claim means no roles. If the provider sends no roles at all, for
  example because the mapper below is not set up, every login takes the system
  admin role away. Fix the provider and log in again to get it back.

The first user on an empty install does not become a system admin by being first
when this is on, since the provider decides who is one. Log in through the
provider with the role to get the first admin.

### Keycloak

Realm roles are in the access token by default but not in the userinfo, which is
what Historia reads. In the realm, under Client scopes → `roles` → Mappers →
`realm roles`, turn on **Add to userinfo**. The roles then arrive as
`realm_access.roles`, the default `OIDC_ROLES_CLAIM`. Create the realm role
`OIDC_SYSTEM_ADMIN_ROLE` names and assign it to the admins.

A client role works the same way: turn on **Add to userinfo** on the
`client roles` mapper and set `OIDC_ROLES_CLAIM=resource_access.<client id>.roles`.

## Troubleshooting

- **500 from `/api/auth/oidc/login`:** the issuer is unreachable or not an OIDC
  issuer (discovery failed), or the client ID or secret is missing. The server
  log names which.
- **"Invalid redirect URI" from the provider:** `<public origin>/api/auth/oidc/callback`
  is not registered for the domain the person is on, or the domain is missing
  from `CMS_ALLOWED_ORIGINS`.
- **`?error=email_not_verified`:** the provider must mark the email as verified.
  In Keycloak, that is the user's "Email verified" flag; the Tessera OTP flow
  sets it on login.
