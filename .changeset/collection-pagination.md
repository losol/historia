---
"@eventuras/historia": patch
---

Paging through a collection works. The Previous and Next buttons went to `/articles/page/N`, which does not exist, and the paged route always listed articles. Every collection now pages under its own localized URL (`/no/c/artikler/page/2`), with Norwegian labels on Norwegian pages.
