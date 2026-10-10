---
'@eventuras/historia': patch
---

Unpublished documents are no longer readable over the API: pages, cases, products, terms and timelines listed never-published documents to visitors. Site editors see their drafts again: articles and instructions let only system admins past `_status: published`, which hid drafts in the admin. All seven collections now read with `authenticatedOrPublished` inside `siteScoped`.
