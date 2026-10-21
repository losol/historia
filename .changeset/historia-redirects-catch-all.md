---
'@eventuras/historia': minor
---

Redirects now work for any path, not only `/c/…`: a page that isn't found, or a first segment that isn't a locale (`/nyheter/<slug>` from an old site), is looked up in Redirects before the 404. These answer 308, so search engines move the old URL's ranking to the new one.
