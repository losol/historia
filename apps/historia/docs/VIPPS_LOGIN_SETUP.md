# Vipps Login Setup Guide

This guide walks you through setting up Vipps Login for the Historia admin (Payload CMS).
Vipps Login is separate from Vipps ePayment (checkout), with its own credentials; see
[VIPPS.md](./VIPPS.md) for payments.

## Prerequisites

- Vipps MobilePay developer account
- Registered Vipps application with the Login API enabled
- A public HTTPS URL for the app. For local development, use a Cloudflare Tunnel
  (see [Local development with HTTPS](#local-development-with-https)).

## Step 1: Get Vipps credentials

1. Log in to the [Vipps Developer Portal](https://portal.vipps.no/)
2. Navigate to your application
3. Enable the **Login API**
4. Note down the **Client ID** and **Client Secret**

## Step 2: Register the redirect URI

Historia does not read the redirect URI from configuration. The login and callback
routes build it from the public origin of the request:

```text
<public origin>/api/auth/vipps/callback
```

Register exactly that in the Vipps portal under **Login API Settings**, for example
`https://historia-dev.example.com/api/auth/vipps/callback` for a tunnel, or
`https://your-domain.com/api/auth/vipps/callback` in production.

Behind a proxy, the origin is taken from `X-Forwarded-Host` / `X-Forwarded-Proto` only
when the host is listed in `CMS_ALLOWED_ORIGINS`; otherwise the request's own `Host` is
used. Add every public origin you use there (see step 3).

## Step 3: Configure environment variables

Copy `.env.example` to `.env` and set:

```bash
# Turn Vipps Login on. Anything other than exactly 'true' leaves it off:
# no auth strategy, /api/auth/vipps/* answers 404, no button on the admin login.
VIPPS_LOGIN_ENABLED=true

# 'test' or 'production' (default: test)
VIPPS_LOGIN_ENVIRONMENT=test

# Vipps Login credentials (separate from the ePayment VIPPS_CLIENT_ID/SECRET)
VIPPS_LOGIN_CLIENT_ID=your-client-id-from-vipps-portal
VIPPS_LOGIN_CLIENT_SECRET=your-client-secret-from-vipps-portal

# Public origin(s) of the app, comma-separated. Used for CORS/CSRF and to trust
# forwarded host headers when building the redirect URI.
CMS_ALLOWED_ORIGINS=https://historia-dev.example.com
NEXT_PUBLIC_CMS_URL=https://historia-dev.example.com
```

## Step 4: Start the app and test

```bash
pnpm install
pnpm dev
```

1. Open `<public origin>/admin`
2. You should see a **"Logg inn med Vipps"** button. It is only shown when
   `VIPPS_LOGIN_ENABLED=true`.
3. Click it. You are sent to Vipps, and after logging in with your Vipps test user you
   come back to `/admin`.

## How users are created and matched

Users are matched on **email**:

- **Existing user with that email:** they are logged in, and their profile is updated
  from Vipps (see `mapVippsUser` in `src/plugins.ts`). Of their addresses, only the one
  labelled "Vipps" is updated (or added if missing); any others are left alone.
- **No user with that email:** a new user is created from the Vipps profile.
- **Vipps account without an email:** the login is refused (`?error=no_email`).

If someone changes their email in Vipps, they will not match their old account and a
new user is created.

### Access for new users

A new Vipps user has no roles and no tenant access. They can sign in, but see nothing
until an admin grants access:

1. Open **Users** in the admin and find the user
2. Under **Tenants**, add the website and pick a role: `admin`, `editor`, `commerce`
   or `member`
3. Save

The one exception is an empty database: the first user ever created becomes
`system-admin`, whether they sign up with Vipps or any other way.

The global `system-admin` role can otherwise only be granted by another system admin. See
[Role-based access control](./administrator/role-based-access-control.md) for what
each role can do.

## Local development with HTTPS

Vipps needs a public HTTPS redirect URI. A quick option is a temporary Cloudflare
Tunnel:

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3100
```

This prints a URL such as `https://random-name.trycloudflare.com`. Put it in
`NEXT_PUBLIC_CMS_URL` and `CMS_ALLOWED_ORIGINS`, and register
`https://random-name.trycloudflare.com/api/auth/vipps/callback` in the Vipps portal.
The URL changes every time; for a stable one, use a named tunnel as described in the
[Historia README](../README.md#local-development-with-https).

## Production

```bash
VIPPS_LOGIN_ENABLED=true
VIPPS_LOGIN_ENVIRONMENT=production
VIPPS_LOGIN_CLIENT_ID=production-client-id
VIPPS_LOGIN_CLIENT_SECRET=production-client-secret
CMS_ALLOWED_ORIGINS=https://your-domain.com
NEXT_PUBLIC_CMS_URL=https://your-domain.com
```

Checklist:

- [ ] Production Vipps Login credentials, and `VIPPS_LOGIN_ENVIRONMENT=production`
- [ ] A strong, stable `CMS_SECRET` (it signs the Payload session cookie)
- [ ] HTTPS for all URLs
- [ ] `CMS_ALLOWED_ORIGINS` lists every public origin
- [ ] The production redirect URI is registered in the Vipps portal
- [ ] Log in end to end once after deploying

### Multiple instances

The login flow keeps no server-side state. The PKCE code verifier and the post-login
redirect are stored in short-lived, HttpOnly cookies on the browser, so any instance
can handle the callback. No sticky sessions are needed.

## Troubleshooting

### The Vipps button is missing, or `/api/auth/vipps/login` returns 404

Vipps Login is off. Set `VIPPS_LOGIN_ENABLED=true` (exactly) and restart.

### 500 from `/api/auth/vipps/login`

Vipps Login is on, but `VIPPS_LOGIN_CLIENT_ID` or `VIPPS_LOGIN_CLIENT_SECRET` is
missing. The server log names which one.

### "Invalid redirect URI" from Vipps

The URI Historia sends (`<public origin>/api/auth/vipps/callback`) is not registered in
the Vipps portal. Check the protocol and host. Behind a proxy, also check that the
public host is in `CMS_ALLOWED_ORIGINS`, or the internal host is used instead.

### "No email" error

The user's Vipps account has no verified email. They need to add one in the Vipps app.

### Login fails after spending a long time at Vipps

The PKCE cookies live for 10 minutes. Start the login again.

### Session not persisting

`CMS_SECRET` changed between deploys, or the site is served over plain HTTP. Keep
`CMS_SECRET` stable and use HTTPS.

## Customization

### User mapping

`mapVippsUser` in `src/plugins.ts` decides which Vipps fields are written to the user
on every login. Keep it to profile data. Do not grant roles or tenant access from
Vipps data, as anything that controls access should be assigned by an admin.

### Disable email/password login

To allow Vipps login only, pass `disableLocalStrategy: true` to `vippsAuthPlugin()` in
`src/plugins.ts`. It is not wired to an environment variable.

⚠️ Make sure a system admin can log in with Vipps before you do this.

## Further reading

- [Vipps Login API documentation](https://developer.vippsmobilepay.com/docs/APIs/login-api/)
- [Payload custom auth strategies](https://payloadcms.com/docs/authentication/custom-strategies)
- [Administrator guide to Vipps Login](./administrator/vipps-login.md)
