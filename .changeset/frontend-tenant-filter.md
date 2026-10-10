---
'@eventuras/historia': patch
---

The frontend serves only the site's own published content. The page, collection, resource and term routes and the archive block queried without a tenant filter, so another site's article or page rendered by URL on any domain (`www.losvikkommune.no/no/c/artikler/<other-site-slug>--<id>`), and a never-published page rendered at its URL. Every visitor-facing query now goes through `siteWhere`: the website of the request's host for collections with a tenant, every document for the shared ones (people, organizations), and published documents only, except in preview where the signed-in editor sees drafts. A URL that belongs to another site, or to an unpublished document, is a 404. The sitemaps use the same helper.
