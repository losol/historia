---
"@eventuras/historia": patch
---

Cart: every component shares one cart, so the count in the header follows every change. Quantity clicks show at once and reach the server in order, so fast clicks are no longer lost, and "Kjøp nå med Vipps" waits until they have. Products that can no longer be bought are removed from the cart when it loads and when checkout opens, with a notice. The cart drawer and checkout show an error with a retry button when prices cannot be loaded, instead of an empty drawer, and older price answers no longer overwrite newer ones. In production the server refuses to start without a valid SESSION_SECRET.
