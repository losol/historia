import type { MetadataRoute } from 'next';
import { getSitemapSite } from '@/lib/sitemap';

// Per request: the sitemap index is on the site's own origin.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSitemapSite();
  return {
    rules: { userAgent: '*', disallow: ['/admin', '/next/', '/*/checkout'] },
    ...(site && { sitemap: `${site.origin}/sitemap.xml` }),
  };
}
