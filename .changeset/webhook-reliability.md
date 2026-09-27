---
"@eventuras/historia": patch
---

The Vipps webhook no longer loses events. A payment event that failed to process was acknowledged with 200 and stored, so Vipps did not retry, and a retry would have been dropped as a duplicate anyway: a failed AUTHORIZED left its order pending for good. Now a failure is recorded on the event and answered with 500, and the retry processes the event again. A signed body that does not parse gets 400 instead of an endless retry, events reported with `success: false` (a failed capture or refund) are recorded without changing the payment, and events are identified by PSP reference, name, idempotency key and timestamp, so two operations sharing a key are no longer taken for one.

An AUTHORIZED that arrives before the payment's CREATED now goes on to create the order instead of stopping after creating the transaction, and orders created from the webhook take their website from the cart rather than the webhook's host. The raw webhook body, with the customer's details, is no longer logged.

Failures where a payment or order is at risk (a paid payment without an order, an amount mismatch, an event that could not be processed) are reported through `reportCritical`: logged as CRITICAL as before, and, when Sentry is configured with a DSN, sent to Sentry as an issue tagged with the payment reference, so they can raise an alert.
