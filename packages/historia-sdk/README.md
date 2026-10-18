# @eventuras/historia-sdk

A small client for reading Historia content from other sites, for example a shop's products or a notice board's notes on a municipality's website. It is plain TypeScript with no runtime dependencies. It runs in browsers, Node 18+ and edge runtimes.

```sh
npm install @eventuras/historia-sdk
```

```ts
import { createHistoriaClient, formatPrice } from '@eventuras/historia-sdk';

const historia = createHistoriaClient({ baseUrl: 'https://shop.example.com' });

const { items, hasNextPage } = await historia.products.list({ limit: 12, sort: 'title' });
for (const product of items) {
  console.log(
    product.title,
    product.price && formatPrice(product.price.amountIncVat, product.price.currency),
    product.url, // the product's page in the shop, where it is bought
  );
}

const poster = await historia.products.get('plakat-fyret'); // by slug, or null
```

## Which website you read from

Historia serves several websites from one deployment and answers each domain with that website's content only.
- `baseUrl` must be one of the website's own domains, as set under the website's domains in Historia.
- Any other domain gets a 403, and the error says so.
- Only published content is returned.

## Options

| Option | Default | |
|---|---|---|
| `baseUrl` | required | The website's address |
| `locale` | `no` | Content language (`no`, `en`) |
| `fetch` | global `fetch` | Your own fetch, e.g. with caching (`next: { revalidate }` in Next.js via a wrapper) |
| `headers` | none | Extra headers on every request |
| `timeoutMs` | `10000` | Give up on a request after this long |

Every call also takes a `signal` to cancel it.

## Products

- `products.list({ limit, page, sort, productType, ids, signal })`
  - Returns one page: `{ items, page, totalPages, totalItems, hasNextPage }`.
  - `limit` is 1–100 (default 20).
  - `sort` is one of `title`, `price`, `createdAt` or `updatedAt`, with a leading `-` for descending.
  - Shipping lines are never included.
- `products.get(slug)`: one product by its slug in the client's locale, or `null`.
- `products.getById(id)`: one product by id, or `null`.

A product has:
- **`id`, `resourceId`, `slug`, `title`, `lead`, `productType`.**
- **`price`:** `{ amountExVat, vatAmount, amountIncVat, vatRate, currency }`, in minor units (øre). It is `null` without a price.
- **`image`:** `{ url, width, height, alt, sizes }`. The `sizes` are `thumbnail`, `square`, `landscape` and so on.
- **`inventory`:** `null` means unlimited.
- **`sku`, `url` (the product page in the shop) and `updatedAt`.**

The types are the SDK's own, not Historia's internal ones, so the CMS can change without breaking sites that use them.

## Notes

```ts
import { createHistoriaClient, toPlainText } from '@eventuras/historia-sdk';

const historia = createHistoriaClient({ baseUrl: 'https://www.example.com' });

const { items } = await historia.notes.list({ limit: 10 }); // the newest first
for (const note of items) {
  console.log(note.title, note.publishedAt, toPlainText(note.content).slice(0, 140));
}

const note = await historia.notes.get('dugnad-pa-kaia'); // by slug, or null
```

- `notes.list({ limit, page, sort, topics, ids, signal })`
  - Returns one page, as for products.
  - `sort` is one of `publishedAt`, `title` or `updatedAt`, with a leading `-` for descending. The default is `-publishedAt`.
  - `topics` keeps the notes about one of the given topics, by the topic's slug.
  - Every note the website has is returned, a `publishedAt` in the future too, as on Historia's own pages.
- `notes.get(slug)`: one note by its slug in the client's locale, or `null`.
- `notes.getById(id)`: one note by id, or `null`.

A note has:
- **`id`, `resourceId`, `slug`, `title`, `publishedAt` and `updatedAt`.**
- **`image`:** as a product's, or `null`. **`imageCaption`** is its caption as plain text.
- **`content`:** its text, as rich text (below). Empty when it has none.
- **`topics`:** `{ id, title, slug }` each.
- **`url`:** the note's page on the Historia website.

## Rich text

Historia keeps rich text in its editor's own format. The SDK hands it on as a small tree of its own instead, so a site draws it with its own components and never depends on the editor:

- **Blocks:** `paragraph`, `heading` (with its `level`), `quote` and `list` (`ordered`, and its `items`). A list inside a list is flattened into it.
- **Inside a block:** `text` with its `marks` (`bold`, `italic`, `underline`, `strikethrough`, `code`), `linebreak` and `link`.
- **A link** has an absolute `url` and `newTab`. A link to another document in Historia goes to that document's page on the website, and says which it is in `document` (`{ collection, slug, resourceId }`), so a site can show it itself.
- **Safe to draw.** A link goes only to http(s), mailto or tel. A link to anything else, or to nothing, is left as its text.
- **Nothing is lost.** Whatever the SDK doesn't know is kept as its text.

`toPlainText(content)` gives the text alone, blocks apart by a blank line, for a summary or alt text.

## Errors

A failed request throws `HistoriaError` with `status`, the HTTP status, or 0 when no answer came back (network error, timeout, aborted), and the request `url`.

## From the browser

Calling from another site's browser needs that site's origin in Historia's `CMS_ALLOWED_ORIGINS` (CORS). From a server, for example a Next.js server component, no setup is needed.

## Releasing (maintainers)

Versions go through changesets like the rest of the repo. When a "chore: version packages" PR is merged, the release job tags the release and publishes the SDK to npm if its version is not there yet (`scripts/release-publish.sh`). It uses trusted publishing (OIDC), so no npm token is stored.

The first version is published by hand, because npm can only trust a workflow for a package that exists:

1. Check out the "chore: version packages" branch that carries the SDK's first version. Run `pnpm install`, then `pnpm --filter @eventuras/historia-sdk build`.
2. Run `cd packages/historia-sdk && pnpm publish --access public --no-git-checks`, logged in to npm (`pnpm login`) as an owner of the `@eventuras` scope.
3. On npmjs.com, under the package's Settings → Trusted publishing, add GitHub Actions with repository `losol/historia` and workflow `historia.yml`.
4. Merge the version PR. The release job sees the version on npm and skips it; later versions are published by the job.

