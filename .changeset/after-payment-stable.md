---
"@eventuras/historia": patch
---

Checkout: the cart is emptied on the server once the order is created, so it no longer comes back on the next visit. The confirmation page only shows the customer's email and address to the session that paid. When the payment status cannot be confirmed in time, the page says so instead of spinning. Aborted, expired or cancelled payments are reported at once from the Vipps API. Alerts about a paid payment without an order now reach the website's sales contacts, are sent once per payment, and raise a critical report when nobody could be notified.
