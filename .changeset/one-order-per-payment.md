---
"@eventuras/historia": patch
---

One order per payment, and payment events only move statuses forward. The Vipps webhook and the return page both create the order for a payment, and each checked for an existing one before creating its own, so arriving together they made two orders and sent two confirmations. Orders now carry the payment's `paymentReference` with a unique index: the second insert fails and that caller uses the first order, and a user created from the Vipps profile at the same moment is handled the same way. Only an `AUTHORIZED` payment becomes an order; a cancelled (`TERMINATED`) or unfinished one used to be recorded as captured.

Transaction and order statuses follow `canTransitionTransaction` and `canTransitionOrderFromPayment` in `lib/commerce/orderStatusRules.ts`. A late or retried event (a `CREATED` after `AUTHORIZED`, an `AUTHORIZED` after capture) no longer moves a payment or order back, a completed order is not reopened and its confirmation not resent, and orders on hold or canceled are left to a person. The return page no longer overwrites a status the webhook has moved further, and a transaction the webhook created is linked to the order.
