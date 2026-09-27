---
"@eventuras/historia": patch
---

Checkout: functions only the server should call are no longer server actions. Before, anyone who knew their action id could call them from outside. They include creating an order from given payment details, sending the orphaned-payment alert, adding a payment reference to the session, and recording order events. Two unused actions are removed. The payment failure event records only a known reason, for a payment the session started. Customer email addresses in logs are masked, and shipping addresses are no longer logged. The cart drawer and checkout use Norwegian texts.
