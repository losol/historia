import { Logger } from '@eventuras/logger';
import configPromise from '@payload-config';
import { headers } from 'next/headers';
import type { ISitemapField } from 'next-sitemap';
import {
  type CollectionSlug,
  getPayload,
  type Payload,
  type TypedLocale,
  type Where,
} from 'payload';
import {
  getDocUrl,
  type ValidCollection,
} from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';
import { getCurrentWebsite } from '@/lib/website';
import { getRequestHost } from '@/utilities/requestHost';

const logger = Logger.create({
  namespace: 'historia:sitemap',
  context: { module: 'sitemap' },
});

/**
 * What a sitemap is built for: the website behind the request's host, at the
 * origin the request came in on. Search engines only accept a sitemap's URLs
 * when they are on the host that served it, so the origin is the request's,
 * not a configured site URL.
 */
export type SitemapSite = {
  origin: string;
  websiteId: string;
};

/** The site of the current request, or null when no website is configured for its host. */
export async function getSitemapSite(): Promise<SitemapSite | null> {
  const requestHeaders = await headers();
  const host = getRequestHost(requestHeaders);
  if (!host) return null;

  let websiteId: string | undefined;
  try {
    websiteId = (await getCurrentWebsite())?.id;
  } catch {
    // Logged by getCurrentWebsite: the host is outside the allowed origins, or
    // no website is configured for it.
    return null;
  }
  if (!websiteId) return null;

  const forwardedProto = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : process.env.NODE_ENV === 'production'
        ? 'https'
        : 'http';

  return { origin: `${protocol}://${host}`, websiteId };
}

const siteLocales = (): string[] => process.env.NEXT_PUBLIC_CMS_LOCALES?.split(',') || ['en'];

/**
 * The published documents of one website in a collection, or every document of a
 * collection shared between the sites (persons, organizations), which has no
 * tenant and is served on each of them.
 */
function siteWhere(payload: Payload, collection: CollectionSlug, websiteId: string): Where {
  const { flattenedFields, versions } = payload.collections[collection].config;
  const conditions: Where[] = [];
  if (flattenedFields.some((field) => field.name === 'tenant')) {
    conditions.push({ tenant: { equals: websiteId } });
  }
  if (versions?.drafts) {
    conditions.push({ _status: { equals: 'published' } });
  }
  return { and: conditions };
}

/**
 * Sitemap entries for the documents of these collections on one website, in
 * every locale. Slugs are localized, so each locale is read separately.
 */
export async function collectionSitemapEntries(
  origin: string,
  websiteId: string,
  collections: readonly ValidCollection[],
): Promise<ISitemapField[]> {
  const payload = await getPayload({ config: configPromise });
  const entries: ISitemapField[] = [];

  for (const locale of siteLocales()) {
    for (const collection of collections) {
      try {
        const { docs } = await payload.find({
          collection,
          locale: locale as TypedLocale,
          draft: false,
          overrideAccess: false,
          depth: 0,
          limit: 1000,
          pagination: false,
          where: siteWhere(payload, collection, websiteId),
          select: { slug: true, resourceId: true, updatedAt: true },
        });

        for (const doc of docs) {
          if (!doc.slug || !doc.resourceId) continue;
          entries.push({
            loc: `${origin}${getDocUrl({ locale, collection, resourceId: doc.resourceId, slug: doc.slug })}`,
            lastmod: doc.updatedAt,
          });
        }
      } catch (error) {
        logger.error({ error, collection, locale, websiteId }, 'Failed to list collection');
      }
    }
  }

  return entries;
}

/**
 * Sitemap entries for the published pages of one website, in every locale. The
 * website's home page is listed at the locale root; the others at the path the
 * nested-docs breadcrumbs give them (`/parent/child`), as the page route serves them.
 */
export async function pageSitemapEntries(
  origin: string,
  websiteId: string,
): Promise<ISitemapField[]> {
  const payload = await getPayload({ config: configPromise });
  const website = await payload.findByID({
    collection: 'websites',
    id: websiteId,
    depth: 0,
    select: { homePage: true },
  });
  const homePageId = typeof website.homePage === 'object' ? website.homePage?.id : website.homePage;

  const entries: ISitemapField[] = [];

  for (const locale of siteLocales()) {
    const { docs } = await payload.find({
      collection: 'pages',
      locale: locale as TypedLocale,
      draft: false,
      overrideAccess: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: siteWhere(payload, 'pages', websiteId),
      select: { slug: true, breadcrumbs: true, updatedAt: true },
    });

    for (const page of docs) {
      const path = page.id === homePageId ? '' : pagePath(page);
      if (path === null) continue;
      entries.push({ loc: `${origin}/${locale}${path}`, lastmod: page.updatedAt });
    }
  }

  return entries;
}

function pagePath(page: {
  slug?: string | null;
  breadcrumbs?: { url?: string | null }[] | null;
}): string | null {
  const url = page.breadcrumbs?.at(-1)?.url;
  if (url) return url;
  return page.slug ? `/${page.slug}` : null;
}
