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
```

`CMS_ALLOWED_ORIGINS` must list the public origins, as for Vipps: it is what
makes a forwarded host trusted when the redirect URI is built behind a proxy.

## How users are matched

The same rules as for Vipps: a returning person is found by the provider's
subject (the `identities` field on the user); otherwise the email finds an
existing user and links the identity, or creates a user, but only when the
provider reports the email as verified (`email_verified`). An unverified email
is refused (`?error=email_not_verified`) and never written to a user.

With `OIDC_ALLOW_SIGNUP=false`, a person without a user is refused
(`?error=signup_disabled`).

A new user has no roles and no tenant access until an admin grants it.

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
