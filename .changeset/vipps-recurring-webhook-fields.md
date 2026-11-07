---
"@eventuras/vipps": patch
---

Recurring webhooks no longer reject an event because `actor`, `currency`, `chargeType` or `failureReason` has a value outside the documented list, so an agreement stopped with `actor: SYSTEM` now parses. Only `eventType` still has to be a known value. The unused `@eventuras/fides-auth` and `openid-client` dependencies are removed.
