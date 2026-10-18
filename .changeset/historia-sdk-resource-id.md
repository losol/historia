---
'@eventuras/historia-sdk': minor
---

`notes.getByResourceId` and `products.getByResourceId`: one note or product by its short id, the one in its URL after the slug (`…--x7k2p9a`). It never changes, so a site can link with `slug--resourceId` as Historia does, and find the document when its slug has changed.
