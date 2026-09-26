// Fills an empty Historia with demo content through its REST API, so a fresh
// `aspire run` shows a working site instead of "No website configuration found".
//
// It only ever seeds an empty site: if a website exists, it stops without
// touching anything, so it is safe to run on every start and never overwrites
// content you have added yourself. To start over, drop the database volume
// (`docker volume rm historia-postgres-data`).
//
// Run by the AppHost, or by hand against a running Historia:
//   node apphost/seed/seed.ts
//
// Environment:
//   HISTORIA_URL         where Historia runs (default http://localhost:3100)
//   SEED_ADMIN_EMAIL     demo admin, created as the first user on an empty database
//   SEED_ADMIN_PASSWORD

import { HistoriaClient } from './client.ts';
import { articles, homePage, website } from './content.ts';

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

if ((await client.count('websites')) > 0) {
  console.log('A website already exists. Skipping the demo seed.');
  process.exit(0);
}

const domain = new URL(baseUrl).host;
const site = await client.create('websites', { ...website, domains: [domain] });
console.log(`Created the website "${website.name}" for ${domain}.`);

const home = await client.create('pages', { ...homePage, tenant: site.id, _status: 'published' });
await client.update('websites', site.id, { homePage: home.id });
console.log('Created the home page.');

for (const article of articles) {
  await client.create('articles', { ...article, tenant: site.id, _status: 'published' });
}
console.log(`Created ${articles.length} articles.`);

console.log(`Done. Open ${baseUrl} or sign in at ${baseUrl}/admin as ${email}.`);
