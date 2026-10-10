---
'@eventuras/historia': patch
---

Each site gets a `robots.txt` and a `sitemap.xml` index on its own domain, pointing at its pages and collections sitemaps. Neither existed: the `next-sitemap` config that was meant to generate them never ran, and it is removed.
