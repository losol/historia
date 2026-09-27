---
"@eventuras/historia": patch
---

Checkout charges what the order contains. The Vipps amount was computed from the items the browser sent, while the order was built from the cart saved on the server, and the check after payment compared the authorized amount with the order total excluding VAT, so a payment up to the VAT short (or for a different cart, from another tab) became an order. Now the payment is priced from the cart as it is saved, the amount and payment reference are stored on that cart before Vipps is called, and order creation requires the authorized amount to equal that amount plus shipping. A mismatch no longer drops the order: it is created on hold, logged as CRITICAL and recorded as a `payment.amount_mismatch` business event. Payment events from the webhook do not release an order that is on hold or canceled.

Cart lines are validated on the server: quantities must be whole numbers from 1 to 99, and only published, non-shipping products of the current website can be added or priced. The Carts hook rejects an invalid quantity instead of rounding it, the Vipps receipt carries each line's total VAT, and a product's 0% VAT is no longer turned into 25%. The session id used for the cart rate limit is kept between attempts.

Errors are logged with their message and stack. `logger.error({ error })` wrote `"error": {}`, because pino only serializes errors under `err`; the logger now serializes both, and `@eventuras/logger` is a server external package so this configuration reaches every route. `SESSION_SECRET`, which the cart session needs, is documented in `.env.example` and set by the AppHost.
