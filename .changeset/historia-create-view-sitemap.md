---
'@eventuras/historia': patch
---

"Create New" works again for articles, cases, pages and timelines in the admin. The view came up without a form: the sitemap hook treated every new draft as something the sitemaps list, and Next refuses to expire a cache while a page is rendering, which is when Payload creates the autosave draft.
