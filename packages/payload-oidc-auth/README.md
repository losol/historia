# @eventuras/payload-oidc-auth

OpenID Connect login for Payload CMS: one plugin, any number of identity providers. Each provider gets its login routes and an auth strategy, and the person ends up with an ordinary Payload session.

```ts
// payload.config.ts
import { oidcAuthPlugin } from '@eventuras/payload-oidc-auth';

plugins: [
  oidcAuthPlugin({
    providers: [
      {
        name: 'tessera',
        label: 'Tessera',
        issuer: 'https://idp.example.com/realms/example',
        clientId: process.env.TESSERA_CLIENT_ID,
        clientSecret: process.env.TESSERA_CLIENT_SECRET,
      },
    ],
  }),
],
```

A button on the admin login page:

```tsx
'use client';
import { OidcLoginButton } from '@eventuras/payload-oidc-auth/client';

export const Login = () => <OidcLoginButton provider="tessera" label="Logg inn med Tessera" />;
```

`@eventuras/payload-vipps-auth` is a provider for this plugin, so Vipps and Keycloak sit side by side in `providers`.

## How a login goes

1. `GET /api/auth/{name}/login` makes a PKCE pair, keeps the verifier in a cookie and sends the person to the provider.
2. `GET /api/auth/{name}/callback` trades the code for tokens, reads who logged in, finds or creates the user, and sets a short-lived encrypted cookie.
3. `GET /api/auth/{name}/session` lets Payload run the provider's auth strategy, which reads that cookie, and sets Payload's own session cookie.

The routes are Payload endpoints, so nothing is added to the Next.js app. The handlers are exported too (`handleOidcLogin`, `handleOidcCallback`, `handleOidcSession`) for a setup that wants its own routes.

## Who the person is

- **By subject first.** The plugin adds an `identities` array (`provider`, `subject`) to the users collection. A user who has logged in with the provider before is found through it, whatever their email is now.
- **Then by verified email.** Without an identity row, the email is used to find an existing user and link the identity, or to create a user. Only an email the provider reports as verified counts: otherwise anyone who registered another person's address with the provider could log in as that person. `requireVerifiedEmail: false` turns the check off for a provider that does not send the claim and is trusted anyway.
- **Signup.** `allowSignup: false` lets only people who already have a user in.
- **Fields.** `mapUser(user, existingUser)` returns what to write on the user; without it, `email`, `email_verified`, `given_name` and `family_name` are written. The result is a plain update, so merge array fields through `existingUser`.

Declare `identitiesField` on the collection yourself when the plugin can be off in some environments (`enabled: false`), so the schema is the same in all of them.

## Options

| Option | Default | |
|---|---|---|
| `providers` | required | See below |
| `enabled` | `true` | |
| `usersCollection` | `'users'` | The auth-enabled collection |
| `allowedDomains` | none | The hosts the deployment serves. With a list, `X-Forwarded-Host` is trusted when it names one, so the login returns to the domain the person is on. |
| `successPath` | `'/admin'` | |
| `errorPath` | `'/admin/login?error={error}'` | `{error}` becomes a code: `oauth_failed`, `invalid_state`, `email_not_verified`, `signup_disabled`, … |

A provider:

| Option | Default | |
|---|---|---|
| `name` | required | Lowercase; used in the routes, cookies and identity rows |
| `issuer` | required | Where discovery happens |
| `clientId`, `clientSecret` | required | |
| `scope` | `'openid profile email'` | |
| `redirectUri` | from the request | Set it to pin one callback URL |
| `basePath` | `/api/auth/{name}` | Must be under Payload's API route |
| `allowSignup` | `true` | |
| `requireVerifiedEmail` | `true` | |
| `mapUser` | standard claims | |
| `createClient` | plain OIDC | For a provider that needs its own client, e.g. extra headers on userinfo |

## Notes

- **Email and password login stays on.** Payload registers its JWT strategy, the one that reads the session cookie, only while some auth collection keeps the local strategy. With `disableLocalStrategy` on the users collection, nobody could stay logged in after an OIDC login either.
- **Custom paths.** `OidcLoginButton` defaults to `/api/auth/{name}/login`; pass `loginPath` when a provider has its own `basePath` or Payload's API route is not `/api`.
- **The handoff cookie** is scoped to `/api/auth/{name}/session`, carries its own expiry (60 s) and is cleared once used.

## Environment

`SESSION_SECRET`: 64 hex characters, used to encrypt the cookie between the callback and the session route (through `@eventuras/fides-auth`).

The provider must have `{origin}/api/auth/{name}/callback` registered as a redirect URI for every domain the deployment serves.
