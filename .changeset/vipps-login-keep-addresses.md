---
"@eventuras/historia": patch
"@eventuras/payload-vipps-auth": minor
---

Vipps Login no longer replaces a user's addresses. Only the address labelled "Vipps" is updated (or added if missing); addresses the user added themselves are kept. `mapVippsUser` now receives the existing user as a second argument, so mappers can merge instead of overwrite.
