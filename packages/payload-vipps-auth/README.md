# @eventuras/payload-vipps-auth

Vipps Login for Payload CMS, as a provider for [`@eventuras/payload-oidc-auth`](../payload-oidc-auth). That plugin does the login flow, the user matching and the session; this package tells it how to talk to Vipps.

## Setup

```ts
// payload.config.ts
import { oidcAuthPlugin } from '@eventuras/payload-oidc-auth';
import { vippsProvider } from '@eventuras/payload-vipps-auth';

plugins: [
  oidcAuthPlugin({
    providers: [
      vippsProvider({
        clientId: process.env.VIPPS_LOGIN_CLIENT_ID,
        clientSecret: process.env.VIPPS_LOGIN_CLIENT_SECRET,
        // The same URL the payments client uses; the OIDC issuer is derived from it.
        apiUrl: process.env.VIPPS_API_URL, // default: https://apitest.vipps.no
      }),
    ],
  }),
],
```

The routes are served by the plugin: `/api/auth/vipps/login`, `/callback` and `/session`. Register `{origin}/api/auth/vipps/callback` as a redirect URI in the Vipps portal for every domain the site answers on.

A button for the admin login page, in Vipps orange:

```tsx
// admin.components.beforeLogin
'use client';
export { VippsLoginButton } from '@eventuras/payload-vipps-auth/client';
```

## Options

`vippsProvider` takes:

| Option | Default | |
|---|---|---|
| `clientId`, `clientSecret` | required | From the Vipps portal |
| `apiUrl` | `https://apitest.vipps.no` | `https://api.vipps.no` in production |
| `scope` | `openid name phoneNumber address email` | |
| `subscriptionKey`, `merchantSerialNumber` | none | Headers Vipps wants on the userinfo call |
| `mapVippsUser(vippsUser, existingUser)` | standard claims plus phone | The fields to write on the user. A plain update: merge array fields such as addresses through `existingUser`. |
| `redirectUri`, `basePath`, `allowSignup`, `requireVerifiedEmail` | see the plugin | Passed through to the provider |

## Users

Vipps reports `email_verified`, and only a verified email links a login to an existing user or creates one. After the first login the user is found by their Vipps subject (`identities` on the user), so a changed email at Vipps does not make a second account.
