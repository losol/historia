---
'@eventuras/historia': patch
---

Sitemaps update as soon as content is published, unpublished or deleted. One hook on every listed collection expires the sitemap caches; before, the article hook touched no sitemap, the case hook named a tag that did not exist, the other collections had no hook, and the `revalidateTag` profile in use served the old sitemap once more before refreshing. The redirects cache gets the same immediate expiry.
