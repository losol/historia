---
'@eventuras/historia': patch
---

`articles-sitemap.xml` is removed: `collections-sitemap.xml` lists the same articles, and the sitemap index never pointed at it. The unused `getHost` helper, which read a variable that does not exist, goes too.
