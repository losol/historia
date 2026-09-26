import { Logger } from '@eventuras/logger';
import configPromise from '@payload-config';
import type { Metadata } from 'next/types';
import { type CollectionSlug, getPayload } from 'payload';
import { generateMeta } from '@/lib/seo';
import { getCurrentWebsite } from '@/lib/website';
import { CollectionListing } from './CollectionListing';
import { getLocalizedCollectionName, pageCollections } from './pageCollections';

const logger = Logger.create({
  namespace: 'historia:pages',
  context: { module: 'CollectionListRoute' },
});

type Props = {
  params: Promise<{
    locale: string;
    collection: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Readonly<Props>) {
  const { locale, collection } = await paramsPromise;
  return <CollectionListing collection={collection} locale={locale} page={1} />;
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{
    locale: string;
    collection: string;
  }>;
}): Promise<Metadata> {
  const { collection } = await paramsPromise;

  // The URL segment is the localized name (e.g. `people`, `artikler`), as in the page heading.
  const capitalizedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);

  const website = await getCurrentWebsite();

  // Create a minimal doc object for collection pages
  const doc = {
    title: capitalizedCollection,
  };

  return generateMeta({ doc, website });
}

export async function generateStaticParams() {
  // Skip static generation during build to avoid database queries
  // Pages will be generated on-demand at runtime (ISR)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  const payload = await getPayload({ config: configPromise });
  const locales = process.env.NEXT_PUBLIC_CMS_LOCALES?.split(',') || ['en'];

  const params: Array<{ locale: string; collection: string }> = [];

  const fetchCollectionDocs = async (collection: string) => {
    try {
      const result = await payload.find({
        collection: collection as CollectionSlug,
        depth: 1,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: {
          slug: true,
        },
      });
      return result.docs || [];
    } catch (error) {
      logger.error({ error, collection }, 'Error fetching documents for collection');
      return [];
    }
  };

  for (const locale of locales) {
    for (const collection of pageCollections) {
      const documents = await fetchCollectionDocs(collection);
      if (documents.length) {
        const localizedCollectionName = getLocalizedCollectionName(collection, locale);
        params.push({ locale, collection: localizedCollectionName });
      }
    }
  }

  logger.debug({ count: params.length }, 'Generated static collection params');
  return params;
}
