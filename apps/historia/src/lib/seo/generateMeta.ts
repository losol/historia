/**
 * Generate Next.js Metadata from Payload CMS documents
 *
 * Smart fallback chain for SEO metadata generation with multi-tenant support.
 */

import type { Metadata } from 'next';
import type { Website } from '@/payload-types';
import { getServerSideURL } from '@/utilities/getURL';
import type { SEODocument } from './types';
import { extractImage, getImageURL } from './utils';

export interface GenerateMetaOptions {
  /**
   * The document to generate metadata for
   */
  doc: SEODocument;

  /**
   * Optional website for fallback meta values and canonical URL domain
   */
  website?: Website | null;

  /**
   * The path the document is served at, locale first (`/no/c/artikler/slug--id`).
   * With the website's first domain it makes the canonical URL.
   */
  path?: string;

  /**
   * Optional base URL for images (defaults to the website's first domain, then getServerSideURL())
   */
  baseUrl?: string;
}

/**
 * Generates Next.js Metadata object from a Payload CMS document
 *
 * Implements smart fallback chain:
 * - **Title**: doc.meta.title → doc.title → website.meta.title → "Historia"
 * - **Description**: doc.meta.description → doc.lead/excerpt → website.meta.description
 * - **Image**: doc.meta.image → doc.image/featuredImage → website.meta.image
 *
 * Image URLs automatically use the optimal `socialShare` format (1200×630px) when available.
 *
 * @param options - Configuration options
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * import { generateMeta } from '@/lib/seo';
 * import { getCurrentWebsite } from '@/lib/website';
 *
 * export async function generateMetadata({ params }) {
 *   const doc = await fetchArticle(params.slug);
 *   const website = await getCurrentWebsite();
 *
 *   return generateMeta({ doc, website, path: `/${params.locale}/c/artikler/${doc.slug}--${doc.resourceId}` });
 * }
 * ```
 */
export async function generateMeta(options: GenerateMetaOptions): Promise<Metadata> {
  const { doc, website, path, baseUrl } = options;

  // The site's first domain is its canonical one; https except in development.
  const domain = website?.domains?.[0];
  const siteUrl = domain
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${domain}`
    : undefined;

  // Images are served from the same domain as the page. NEXT_PUBLIC_CMS_URL is not
  // set in every deployment, and its fallback (localhost) gave share images that
  // Facebook and others could not fetch.
  const serverUrl = baseUrl || siteUrl || getServerSideURL();

  // Title fallback chain
  const title =
    doc.meta?.title ||
    doc.title ||
    (typeof website?.meta?.title === 'string' ? website.meta.title : null) ||
    'Historia';

  // Description fallback chain
  const description =
    doc.meta?.description ||
    doc.lead ||
    doc.excerpt ||
    (typeof website?.meta?.description === 'string' ? website.meta.description : null) ||
    undefined;

  // Image fallback chain
  const docImage = extractImage(doc);
  const websiteImage = website?.meta?.image
    ? extractImage({ meta: { image: website.meta.image } })
    : null;

  const image = docImage || websiteImage;
  const imageData = image ? getImageURL(image, serverUrl) : null;

  const canonical = path && siteUrl ? `${siteUrl}${path}` : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description: description || undefined,
      images: imageData
        ? [
            {
              url: imageData.url,
              width: imageData.width,
              height: imageData.height,
            },
          ]
        : undefined,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || undefined,
      images: imageData ? [imageData.url] : undefined,
    },
  };
}
