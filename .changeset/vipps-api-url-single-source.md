---
'@eventuras/historia': patch
'@eventuras/vipps': patch
---

Select the Vipps environment with `VIPPS_API_URL` everywhere. The library and the app already did, but the CLI scripts each had their own flag: `packages/vipps/scripts` read `VIPPS_USE_TEST_MODE` and `apps/historia/scripts/vipps-get-payment.ts` read `VIPPS_IS_TEST`, both deriving the URL themselves. Three names for one setting, and the scripts ignored the `VIPPS_API_URL` sitting in the `.env` file they load with `--env-file`, so setting it to production left `webhook:setup`, `webhook:list`, `webhook:delete` and `payment:get` quietly talking to test. They now read `VIPPS_API_URL`, with the same `https://apitest.vipps.no` default as the app, so a forgotten variable still cannot reach production.

**If you have `VIPPS_USE_TEST_MODE=false` or `VIPPS_IS_TEST=false` in a local `.env`, replace it with `VIPPS_API_URL=https://api.vipps.no`.** The old names are no longer read, so those scripts would otherwise fall back to the test environment. `webhook:setup` now prints the API URL it resolved rather than a TEST/PRODUCTION label derived from a separate flag that could disagree with it.

Also drops two environment variables that were declared but never read: `VIPPS_CALLBACK_TOKEN` and `VIPPS_SUBSCRIPTION_KEY_SECONDARY`. Nothing consumed either one. Webhooks are authenticated by HMAC with `VIPPS_WEBHOOK_SECRET`, and the `callbackAuthorizationToken` the token's name suggests belongs to Vipps' dynamic shipping callback, which the checkout does not use — it sends `shipping.fixedOptions`. A declared but unread secret is worse than none, because it implies callbacks are verified by something that never verifies them.
