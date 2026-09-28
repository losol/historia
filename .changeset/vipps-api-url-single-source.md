---
'@eventuras/historia': patch
'@eventuras/vipps': patch
---

Select the Vipps environment with `VIPPS_API_URL` everywhere. The library and the app already did, but the CLI scripts each had their own flag: `packages/vipps/scripts` read `VIPPS_USE_TEST_MODE` and `apps/historia/scripts/vipps-get-payment.ts` read `VIPPS_IS_TEST`, both deriving the URL themselves. Three names for one setting, and the scripts ignored the `VIPPS_API_URL` sitting in the `.env` file they load with `--env-file`, so setting it to production left `webhook:setup`, `webhook:list`, `webhook:delete` and `payment:get` quietly talking to test. They now read `VIPPS_API_URL`, with the same `https://apitest.vipps.no` default as the app, so a forgotten variable still cannot reach production.

**If you have `VIPPS_USE_TEST_MODE=false` or `VIPPS_IS_TEST=false` in a local `.env`, replace it with `VIPPS_API_URL=https://api.vipps.no`.** The old names are no longer read, so those scripts would otherwise fall back to the test environment. `webhook:setup` now prints the API URL it resolved rather than a TEST/PRODUCTION label derived from a separate flag that could disagree with it.

Also drops two environment variables that were declared but never read: `VIPPS_CALLBACK_TOKEN` and `VIPPS_SUBSCRIPTION_KEY_SECONDARY`. Nothing consumed either one. Webhooks are authenticated by HMAC with `VIPPS_WEBHOOK_SECRET`, and the `callbackAuthorizationToken` the token's name suggests belongs to Vipps' dynamic shipping callback, which the checkout does not use — it sends `shipping.fixedOptions`. A declared but unread secret is worse than none, because it implies callbacks are verified by something that never verifies them.

`VIPPS_API_URL` is now resolved through `resolveApiUrl()` in `@eventuras/vipps/vipps-core`, which trims the value and strips trailing slashes. Every caller builds endpoints as `${config.apiUrl}/...`, so a pasted `https://api.vipps.no/` produced `//accesstoken/get`; Vipps routes on the exact path, making that a 404 rather than a cosmetic difference. The app's own config read the variable verbatim too, so this closes it on the production path, not only in the scripts. The helper also replaces four copies of the `https://apitest.vipps.no` default, including the one in the startup log, so the logged URL can no longer disagree with the one the client calls.

Removes `VIPPS_LOGIN_ENVIRONMENT`. Vipps Login had its own `'test' | 'production'` switch, mapped inside the plugin to `VippsEnvironments`, whose values are `https://apitest.vipps.no` and `https://api.vipps.no` — the same two URLs `VIPPS_API_URL` already carries. The OIDC issuer is that URL plus `/access-management-1.0/access/`, so it was a second way to express one setting, with its own silent test default, and it was never declared in `app.config.json` at all. The plugin now takes `apiUrl` instead of `environment`, and Login follows `VIPPS_API_URL` like payments do. It also picks up the trailing-slash normalisation, which the issuer's own `${apiUrl}/...` concatenation needed.

> **Deployments must set `VIPPS_API_URL` before taking this.** Vipps Login now reads it. An environment that set `VIPPS_LOGIN_ENVIRONMENT=production` but left `VIPPS_API_URL` unset will fall back to the test environment, and real logins will fail against it. Check the startup log, which prints the resolved Vipps API URL and marks it `(test)`.

