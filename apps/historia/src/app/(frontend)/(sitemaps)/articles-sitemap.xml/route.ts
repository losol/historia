import { unstable_cache } from 'next/cache';
import { getServerSideSitemap } from 'next-sitemap';
import { collectionSitemapEntries, getSitemapSite } from '@/lib/sitemap';

// The articles alone; collections-sitemap.xml lists them too. Cached per site
// (the arguments are part of the key) and rebuilt hourly.
const getArticlesSitemap = unstable_cache(
  (origin: string, websiteId: string) => collectionSitemapEntries(origin, websiteId, ['articles']),
  ['articles-sitemap'],
  { tags: ['articles-sitemap'], revalidate: 60 * 60 },
);

export async function GET() {
  const site = await getSitemapSite();
  if (!site) {
    return new Response('No website is configured for this host', { status: 404 });
  }

  return getServerSideSitemap(await getArticlesSitemap(site.origin, site.websiteId));
}
