import { unstable_cache } from 'next/cache';
import { getServerSideSitemap } from 'next-sitemap';
import { getSitemapSite, pageSitemapEntries } from '@/lib/sitemap';

// Cached per site (the arguments are part of the key), cleared when a page is
// published, and in any case rebuilt hourly.
const getPagesSitemap = unstable_cache(pageSitemapEntries, ['pages-sitemap'], {
  tags: ['pages-sitemap'],
  revalidate: 60 * 60,
});

export async function GET() {
  const site = await getSitemapSite();
  if (!site) {
    return new Response('No website is configured for this host', { status: 404 });
  }

  return getServerSideSitemap(await getPagesSitemap(site.origin, site.websiteId));
}
