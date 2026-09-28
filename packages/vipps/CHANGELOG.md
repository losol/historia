# @eventuras/vipps

## 0.2.11

### Patch Changes

- 063c396: Select the Vipps environment with `VIPPS_API_URL` everywhere. The library and the app already did, but the CLI scripts each had their own flag: `packages/vipps/scripts` read `VIPPS_USE_TEST_MODE` and `apps/historia/scripts/vipps-get-payment.ts` read `VIPPS_IS_TEST`, both deriving the URL themselves. Three names for one setting, and the scripts ignored the `VIPPS_API_URL` sitting in the `.env` file they load with `--env-file`, so setting it to production left `webhook:setup`, `webhook:list`, `webhook:delete` and `payment:get` quietly talking to test. They now read `VIPPS_API_URL`, with the same `https://apitest.vipps.no` default as the app, so a forgotten variable still cannot reach production.
  
  **If you have `VIPPS_USE_TEST_MODE=false` or `VIPPS_IS_TEST=false` in a local `.env`, replace it with `VIPPS_API_URL=https://api.vipps.no`.** The old names are no longer read, so those scripts would otherwise fall back to the test environment. `webhook:setup` now prints the API URL it resolved rather than a TEST/PRODUCTION label derived from a separate flag that could disagree with it.
  
  Also drops two environment variables that were declared but never read: `VIPPS_CALLBACK_TOKEN` and `VIPPS_SUBSCRIPTION_KEY_SECONDARY`. Nothing consumed either one. Webhooks are authenticated by HMAC with `VIPPS_WEBHOOK_SECRET`, and the `callbackAuthorizationToken` the token's name suggests belongs to Vipps' dynamic shipping callback, which the checkout does not use — it sends `shipping.fixedOptions`. A declared but unread secret is worse than none, because it implies callbacks are verified by something that never verifies them.
  
  `VIPPS_API_URL` is now resolved through `resolveApiUrl()` in `@eventuras/vipps/vipps-core`, which trims the value and strips trailing slashes. Every caller builds endpoints as `${config.apiUrl}/...`, so a pasted `https://api.vipps.no/` produced `//accesstoken/get`; Vipps routes on the exact path, making that a 404 rather than a cosmetic difference. The app's own config read the variable verbatim too, so this closes it on the production path, not only in the scripts. The helper also replaces four copies of the `https://apitest.vipps.no` default, including the one in the startup log, so the logged URL can no longer disagree with the one the client calls.
  
  Removes `VIPPS_LOGIN_ENVIRONMENT`. Vipps Login had its own `'test' | 'production'` switch, mapped inside the plugin to `VippsEnvironments`, whose values are `https://apitest.vipps.no` and `https://api.vipps.no` — the same two URLs `VIPPS_API_URL` already carries. The OIDC issuer is that URL plus `/access-management-1.0/access/`, so it was a second way to express one setting, with its own silent test default, and it was never declared in `app.config.json` at all. The plugin now takes `apiUrl` instead of `environment`, and Login follows `VIPPS_API_URL` like payments do. It also picks up the trailing-slash normalisation, which the issuer's own `${apiUrl}/...` concatenation needed.
  
  > **Deployments must set `VIPPS_API_URL` before taking this.** Vipps Login now reads it. An environment that set `VIPPS_LOGIN_ENVIRONMENT=production` but left `VIPPS_API_URL` unset will fall back to the test environment, and real logins will fail against it. Check the startup log, which prints the resolved Vipps API URL and marks it `(test)`.
- fe0d986: `verifyWebhookSignature` compares the content hash and the signature in constant time.

## 0.2.10

### Patch Changes

- Updated dependencies [7bcf252]
  - @eventuras/fides-auth@0.9.0

## 0.2.9

### Patch Changes

- Updated dependencies [2fed638]
  - @eventuras/fides-auth@0.8.0

## 0.2.8

### Patch Changes

- Updated dependencies [3796814]
  - @eventuras/fides-auth@0.7.1

## 0.2.7

### Patch Changes

- Updated dependencies [22c3761]
- Updated dependencies [a29b507]
  - @eventuras/fides-auth@0.7.0
  - @eventuras/logger@0.8.1

## 0.2.6

### Patch Changes

- Updated dependencies [7caaea2]
  - @eventuras/fides-auth@0.6.0

## 0.2.5

### Patch Changes

- Updated dependencies [0783155]
  - @eventuras/fides-auth@0.5.0

## 0.2.4

### Patch Changes

- Updated dependencies [ea5bb15]
- Updated dependencies [7d2b896]
- Updated dependencies [fc1f5dc]
  - @eventuras/fides-auth@0.4.0
  - @eventuras/logger@0.8.0

## 0.2.3

### Patch Changes

- 7c9fe79: chore: update dependencies
- Updated dependencies [7c9fe79]
  - @eventuras/fides-auth@0.3.1
  - @eventuras/logger@0.7.1

## 0.2.2

### Patch Changes

- Updated dependencies [6e7d2d4]
  - @eventuras/logger@0.7.0

## 0.2.1

### Patch Changes

- Updated dependencies [d752b18]
  - @eventuras/fides-auth@0.3.0

## 0.2.0

### Minor Changes

- ### 🧱 Features
  - Add transactions collection and payment details scripts for Vipps integration
  - Add support for setting up webhooks
  - Add polling utilities and enhance payment event logging
  - Update webhook scripts with improved functionality

  ### 🧪 Testing
  - Add integration tests for Vipps payment flows

### Patch Changes

- Updated dependencies
  - @eventuras/logger@0.6.0
  - @eventuras/fides-auth@0.2.1

## 0.1.2

### Patch Changes

- chore: update dependencies across frontend packages

## 0.1.1

### Patch Changes

- Updated dependencies
  - @eventuras/logger@0.5.0
