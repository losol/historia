---
'@eventuras/historia': patch
---

Pages carry a canonical URL again: `<link rel="canonical">` and `og:url` are the website's first domain plus the path the document is served at. The old code depended on a `locale` property documents never have, so no page had one, and it would have built collection URLs without `/c/` and the collection name. The home page is canonical at the locale root, and a site reached on a secondary domain points at its first.
