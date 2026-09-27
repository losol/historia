import { Logger } from '@eventuras/logger';
import { Container } from '@eventuras/ratio-ui/layout/Container';
import configPromise from '@payload-config';
import { notFound } from 'next/navigation';
import { type CollectionSlug, getPayload } from 'payload';
import { CollectionArchive } from '@/components/CollectionArchive';
import { PageRange } from '@/components/PageRange';
import { Pagination } from '@/components/Pagination';
import {
  getOriginalCollectionName,
  isSiteLocale,
  type PageCollectionsType,
  pageCollections,
} from './pageCollections';

const logger = Logger.create({
  namespace: 'historia:pages',
  context: { module: 'CollectionListRoute' },
});

const PAGE_SIZE = 20;

function isValidCollection(collection: string): collection is PageCollectionsType {
  return (pageCollections as readonly string[]).includes(collection);
}

/**
 * The list of a collection's documents, shared by the first page (`c/[collection]`) and the
 * following ones (`c/[collection]/page/[pageNumber]`).
 */
export async function CollectionListing({
  locale,
  collection,
  page,
}: {
  locale: string;
  /** The collection's name in the URL, localized (e.g. `artikler`). */
  collection: string;
  page: number;
}) {
  if (!isSiteLocale(locale)) notFound();
  const payload = await getPayload({ config: configPromise });

  const originalCollectionName = getOriginalCollectionName(collection, locale);
  logger.debug({ collection, originalCollectionName, locale }, 'Mapped collection');

  if (!isValidCollection(originalCollectionName)) {
    logger.info({ collection: originalCollectionName }, 'Invalid collection');
    notFound();
  }

  try {
    const docsPage = await payload.find({
      collection: originalCollectionName as CollectionSlug,
      // Titles and slugs are localized; without this the default locale's are listed.
      // @ts-expect-error - Payload's locale parameter type doesn't match our string type
      locale,
      depth: 1,
      limit: PAGE_SIZE,
      page,
      overrideAccess: false,
      // What the cards show. Persons and organizations have a name instead of a title.
      select: {
        title: true,
        name: true,
        lead: true,
        slug: true,
        resourceId: true,
        image: { media: true },
      },
      // exclude shipping products if it is a product listings
      where:
        originalCollectionName === 'products'
          ? {
              productType: {
                not_equals: 'shipping',
              },
            }
          : undefined,
    });

    if (!docsPage.docs?.length) {
      logger.info({ collection: originalCollectionName }, 'No documents found for collection');
      notFound();
    }

    const capitalizedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);

    return (
      <Container>
        <h1>{capitalizedCollection}</h1>

        <CollectionArchive
          // @ts-expect-error
          docs={docsPage.docs}
          // @ts-expect-error
          relationTo={originalCollectionName}
        />

        {docsPage.totalPages > 1 && (
          <div className="mb-8">
            <Pagination
              basePath={`/${locale}/c/${collection}`}
              page={docsPage.page ?? page}
              totalPages={docsPage.totalPages}
            />
            <PageRange
              locale={locale}
              label={collection}
              currentPage={docsPage.page}
              limit={PAGE_SIZE}
              totalDocs={docsPage.totalDocs}
            />
          </div>
        )}
      </Container>
    );
  } catch (error) {
    logger.error({ error, collection: originalCollectionName }, 'Error fetching collection');
    notFound();
  }
}
