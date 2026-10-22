---
'@eventuras/historia': patch
---

Follow-up to the search topics fix: the search collection's topics array no longer declares its own `id` field, so Payload's built-in row id (with its generated default) is used. Without it, a document with any topic failed to save with `null value in column "id"`.
