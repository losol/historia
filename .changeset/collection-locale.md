---
"@eventuras/historia": patch
---

Collection lists and document pages show the requested language. They queried without a locale, so English pages listed Norwegian titles, linked to Norwegian slugs and showed Norwegian text. A document opened under the other language's slug is redirected to its own, and the redirects now keep the `/c/` in the path. A collection name from the other language (`/en/c/artikler/…`) is redirected too instead of failing with a 500, and an unknown one is a 404.
