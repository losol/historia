import { getServerSideSitemapIndex } from 'next-sitemap';
import { getSitemapSite } from '@/lib/sitemap';

// The index robots.txt points to: the site's sitemaps on its own origin.
export async function GET() {
  const site = await getSitemapSite();
  if (!site) {
    return new Response('No website is configured for this host', { status: 404 });
  }

  return getServerSideSitemapIndex([
    `${site.origin}/pages-sitemap.xml`,
    `${site.origin}/collections-sitemap.xml`,
  ]);
}
