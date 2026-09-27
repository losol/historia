// Fills an empty Historia with demo content through its REST API, so a fresh
// `aspire run` shows a working site instead of "No website configuration found".
//
// It only ever seeds an empty site: if any collection it writes to has documents,
// it stops without touching anything, so it is safe to run on every start and
// never overwrites content you have added yourself. To start over, drop the
// database volume (`docker volume rm historia-postgres-data`).
//
// Run by the AppHost, or by hand against a running Historia:
//   node apphost/seed/seed.ts
//
// Environment:
//   HISTORIA_URL         where Historia runs (default http://localhost:3100)
//   SEED_ADMIN_EMAIL     demo admin, created as the first user on an empty database
//   SEED_ADMIN_PASSWORD

import { type Doc, HistoriaClient } from './client.ts';
import { articles, componentsPage, homePage, images, products, website } from './content.ts';
import { seascape } from './images.ts';

const baseUrl = process.env.HISTORIA_URL ?? 'http://localhost:3100';
const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@historia.local';
const password = process.env.SEED_ADMIN_PASSWORD ?? 'historia';

const client = new HistoriaClient(baseUrl);

console.log(`Waiting for Historia at ${baseUrl}...`);
await client.waitUntilReady();

if (await client.hasUsers()) {
  // Not a fresh database. Sign in only to check for content; if these are not
  // the demo credentials, this is someone's own data and stays untouched.
  try {
    await client.login(email, password);
  } catch {
    console.log(`Users exist and ${email} cannot sign in, so this is not the demo. Skipping.`);
    process.exit(0);
  }
} else {
  await client.registerFirstUser(email, password);
  console.log(`Created the demo admin ${email} (system-admin).`);
}

// Every collection the seed writes to must be empty, not just websites: pages or
// articles can exist without one, e.g. after a partial import.
for (const collection of ['websites', 'pages', 'articles', 'products', 'media']) {
  if ((await client.count(collection)) > 0) {
    console.log(`The database already has ${collection}. Skipping the demo seed.`);
    process.exit(0);
  }
}

const domain = new URL(baseUrl).host;
const site = await client.create('websites', { ...website, domains: [domain] });
console.log(`Created the website "${website.name}" for ${domain}.`);

/**
 * Creates a document in Norwegian, then adds its English values. The English story
 * reuses the Norwegian blocks' ids, so the blocks get a translation instead of
 * being replaced.
 */
async function createInBothLocales(
  collection: string,
  shared: Record<string, unknown>,
  localized: { no: Record<string, unknown>; en: { story?: object[] } & Record<string, unknown> },
): Promise<Doc> {
  const doc = await client.create(collection, { ...shared, ...localized.no });
  const blocks = (doc.story ?? []) as { id: string }[];
  const { story, ...en } = localized.en;
  await client.update(
    collection,
    doc.id,
    {
      ...en,
      // Drafts are enabled, so the update has to say it stays published.
      _status: shared._status,
      ...(story && { story: story.map((block, index) => ({ ...block, id: blocks[index]?.id })) }),
    },
    'en',
  );
  return doc;
}

const mediaIds: string[] = [];
for (const image of images) {
  const media = await client.upload(
    'media',
    { name: image.file, type: 'image/png', data: seascape(image.palette) },
    { title: image.no },
  );
  await client.update('media', media.id, { title: image.en }, 'en');
  mediaIds.push(media.id);
}
console.log(`Uploaded ${mediaIds.length} images.`);

const productIds: string[] = [];
for (const [index, { price, no, en }] of products.entries()) {
  const product = await createInBothLocales(
    'products',
    {
      tenant: site.id,
      _status: 'published',
      productType: 'physical',
      price: { amountExVat: price, currency: 'NOK', vatRate: 25 },
      image: { media: mediaIds[index % mediaIds.length] },
    },
    { no, en },
  );
  productIds.push(product.id);
}
console.log(`Created ${productIds.length} products, in Norwegian and English.`);

const home = await createInBothLocales(
  'pages',
  { tenant: site.id, _status: 'published', image: { media: mediaIds[0] } },
  homePage,
);
await client.update('websites', site.id, { homePage: home.id });
console.log('Created the home page, in Norwegian and English.');

await createInBothLocales(
  'pages',
  { tenant: site.id, _status: 'published' },
  componentsPage({ mediaIds, productIds }),
);
console.log('Created the components page, in Norwegian and English.');

for (const [index, { publishedAt, no, en }] of articles.entries()) {
  await createInBothLocales(
    'articles',
    {
      tenant: site.id,
      _status: 'published',
      publishedAt,
      // Every other article has an image, so lists show cards with and without one.
      ...(index % 2 === 0 && { image: { media: mediaIds[index % mediaIds.length] } }),
    },
    { no, en },
  );
}
console.log(`Created ${articles.length} articles, in Norwegian and English.`);

console.log(`Done. Open ${baseUrl} or sign in at ${baseUrl}/admin as ${email}.`);
