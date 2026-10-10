---
'@eventuras/historia': patch
---

The search index is per site: `/api/search` listed every site's entries. Entries now carry the website of the document they index, visitors only get the entries of the site they are on, and a migration fills in the website for existing entries.
