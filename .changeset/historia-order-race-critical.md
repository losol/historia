---
'@eventuras/historia': patch
---

When the Vipps webhook and the return page create the order for a payment at the same time, the one that loses now uses the other's order instead of reporting a critical "payment may be authorized but order not created". The check for a lost race used `instanceof ValidationError`, which fails when Payload is bundled per route.
