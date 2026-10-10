import { unstable_cache } from 'next/cache';
import { getServerSideSitemap } from 'next-sitemap';
import { pageCollections } from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';
import { collectionSitemapEntries, getSitemapSite } from '@/lib/sitemap';

// Cached per site (the arguments are part of the key) and rebuilt hourly.
const getCollectionsSitemap = unstable_cache(
  (origin: string, websiteId: string) =>
    collectionSitemapEntries(origin, websiteId, pageCollections),
  ['collections-sitemap'],
  { tags: ['collections-sitemap'], revalidate: 60 * 60 },
);

export async function GET() {
  const site = await getSitemapSite();
  if (!site) {
    return new Response('No website is configured for this host', { status: 404 });
  }

  return getServerSideSitemap(await getCollectionsSitemap(site.origin, site.websiteId));
}
