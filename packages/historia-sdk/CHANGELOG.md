# @eventuras/historia-sdk

## 0.3.0

### Minor Changes

- 82be8ca: `notes.getByResourceId` and `products.getByResourceId`: one note or product by its short id, the one in its URL after the slug (`…--x7k2p9a`). It never changes, so a site can link with `slug--resourceId` as Historia does, and find the document when its slug has changed.

## 0.2.0

### Minor Changes

- ac9fcbd: Notes: `notes.list`, `notes.get` (by slug) and `notes.getById` read a website's notes, the newest first, with their picture, topics and page on the website. A note's text comes as rich text in the SDK's own small shape (paragraphs, headings, quotes, lists; marks, line breaks and links), not the editor's, with links made absolute and only to safe schemes. `toPlainText` gives the text alone.

## 0.1.0

### Minor Changes

- 8ff65ea: New package: a small client for reading a Historia website's published products from other sites. Plain TypeScript without runtime dependencies, for browsers, Node and edge runtimes. `products.list`, `products.get` (by slug) and `products.getById`, with prices, images and the product's shop URL in a small public shape, `HistoriaError` for failed requests and `formatPrice` for minor units.
