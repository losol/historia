import { cache } from 'react';
import { Logger } from '@eventuras/logger';
import { Story, StoryBody, StoryHeader } from '@eventuras/ratio-ui/blocks/Story';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Lead } from '@eventuras/ratio-ui/core/Lead';
import { Container } from '@eventuras/ratio-ui/layout/Container';
import { Image } from '@eventuras/ratio-ui-next/Image';
import configPromise from '@payload-config';
import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { type CollectionSlug, getPayload } from 'payload';
import { RenderBlocks } from '@/blocks/RenderBlocks';
import { LivePreviewListener } from '@/components/LivePreviewListener';
import { PayloadRedirects } from '@/components/PayloadRedirects';
import { ProductActions } from '@/components/ProductActions';
import RichText from '@/components/RichText';
import { generateMeta } from '@/lib/seo';
import { getCurrentWebsite } from '@/lib/website';
import type { Product } from '@/payload-types';
import { getImageProps } from '@/utilities/image';
import {
  getLocalizedCollectionName,
  type PageCollectionsType,
  pageCollections,
  resolvePageCollection,
} from '../pageCollections';
import PageClient from './page.client';

const logger = Logger.create({
  namespace: 'historia:pages',
  context: { module: 'CollectionDocumentRoute' },
});

/**
 * Parse slug in format: {human-readable-slug}--{resourceId}
 */
function parseSlugWithResourceId(
  combinedSlug: string,
): { slug: string; resourceId: string } | null {
  const lastDashDashIndex = combinedSlug.lastIndexOf('--');

  if (lastDashDashIndex === -1 || lastDashDashIndex === combinedSlug.length - 2) {
    // No '--' separator found, or it's at the end
    return null;
  }

  const slug = combinedSlug.substring(0, lastDashDashIndex);
  const resourceId = combinedSlug.substring(lastDashDashIndex + 2);

  if (!slug || !resourceId) {
    return null;
  }

  return { slug, resourceId };
}

export async function generateStaticParams() {
  // Skip static generation during build to avoid database queries
  // Pages will be generated on-demand at runtime (ISR)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return [];
  }

  const payload = await getPayload({ config: configPromise });

  const locales = process.env.NEXT_PUBLIC_CMS_LOCALES?.split(',') || ['en'];

  const params: Array<{
    locale: string;
    collection: string;
    slug: string;
  }> = [];

  const fetchCollectionDocs = async (collection: string, locale: string) => {
    const result = await payload.find({
      collection: collection as CollectionSlug,
      draft: false,
      // Slugs are localized, so each locale has its own paths.
      // @ts-expect-error - Payload's locale parameter type doesn't match our string type
      locale,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, resourceId: true },
    });

    return result.docs || [];
  };

  for (const locale of locales) {
    for (const collection of pageCollections) {
      try {
        const documents = await fetchCollectionDocs(collection, locale);

        const localizedCollectionName = getLocalizedCollectionName(collection, locale);

        // @ts-expect-error - Payload types don't include select fields
        documents.forEach(({ slug, resourceId }) => {
          if (slug && resourceId) {
            const combinedSlug = `${slug}--${resourceId}`;
            params.push({
              locale,
              collection: localizedCollectionName,
              slug: combinedSlug,
            });
          }
        });
      } catch (error) {
        logger.error({ error, collection, locale }, 'Failed to fetch documents for static params');
      }
    }
  }

  return params;
}

type Args = {
  params: Promise<{
    locale: string;
    collection: string;
    slug: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Readonly<Args>) {
  const { isEnabled: draft } = await draftMode();
  const props = await paramsPromise;
  const { locale, collection, slug: combinedSlug } = props;

  // Parse the combined slug to extract resourceId
  const parsed = parseSlugWithResourceId(combinedSlug);

  if (!parsed) {
    // Invalid slug format, redirect to 404
    return <PayloadRedirects url={`/${locale}/c/${collection}/${combinedSlug}`} />;
  }

  const { slug, resourceId } = parsed;

  const originalCollectionName = resolvePageCollection(collection, locale);
  if (!originalCollectionName) notFound();
  const localizedCollectionName = getLocalizedCollectionName(originalCollectionName, locale);

  // Redirect if the provided collection name is not localized
  if (collection !== localizedCollectionName) {
    redirect(`/${locale}/c/${localizedCollectionName}/${combinedSlug}`);
  }

  const document = await queryDocumentByResourceId({
    collection: originalCollectionName as PageCollectionsType,
    resourceId,
    locale,
  });

  if (!document) {
    return <PayloadRedirects url={`/${locale}/c/${localizedCollectionName}/${combinedSlug}`} />;
  }

  // Check for slug mismatch and redirect permanently to the correct URL (308 Permanent Redirect)
  if (document.slug !== slug) {
    const correctCombinedSlug = `${document.slug}--${resourceId}`;
    permanentRedirect(`/${locale}/c/${localizedCollectionName}/${correctCombinedSlug}`);
  }

  const titleToUse = 'title' in document ? document.title : document.name;
  const isProduct = originalCollectionName === 'products';
  const hasLead = 'lead' in document && document.lead;
  const hasImage = 'image' in document && document.image;
  const imageFormat = isProduct ? 'square' : 'landscape';
  const imageProps = hasImage ? getImageProps(document.image, imageFormat) : null;

  return (
    <Container>
      <Story as="article" className="px-3">
        <PageClient />

        <PayloadRedirects
          disableNotFound
          url={`/${locale}/c/${localizedCollectionName}/${combinedSlug}`}
        />

        {draft && <LivePreviewListener />}

        <StoryHeader>
          {imageProps?.url && (
            <>
              <Image
                src={imageProps.url}
                alt={imageProps.alt || titleToUse || ''}
                width={imageProps.width}
                height={imageProps.height}
                loading="eager"
              />
              {imageProps.caption && (
                <div className="text-sm text-muted-foreground mt-2">
                  <RichText data={imageProps.caption} />
                </div>
              )}
            </>
          )}
          <Heading as="h1">{titleToUse}</Heading>
          {hasLead && <Lead>{document.lead}</Lead>}
        </StoryHeader>

        <StoryBody>
          {isProduct && <ProductActions product={document as Product} locale={locale} />}

          {'content' in document && document.content ? <RichText data={document.content} /> : null}
          {'story' in document && document.story ? <RenderBlocks blocks={document.story} /> : null}
        </StoryBody>
      </Story>
    </Container>
  );
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { collection, locale, slug: combinedSlug } = await params;

  const parsed = parseSlugWithResourceId(combinedSlug);

  if (!parsed) {
    return {};
  }

  const { resourceId } = parsed;
  const originalCollectionName = resolvePageCollection(collection, locale);
  if (!originalCollectionName) return {};

  const document = await queryDocumentByResourceId({
    collection: originalCollectionName as PageCollectionsType,
    resourceId,
    locale,
  });
  // The page itself answers 404; generateMeta needs a document.
  if (!document) return {};

  const website = await getCurrentWebsite();

  return generateMeta({ doc: document, website });
}

const queryDocumentByResourceId = cache(
  async ({
    collection,
    resourceId,
    locale,
  }: {
    collection: PageCollectionsType;
    resourceId: string;
    locale: string;
  }) => {
    const { isEnabled: draft } = await draftMode();
    const payload = await getPayload({ config: configPromise });

    const result = await payload.find({
      collection,
      draft,
      // @ts-expect-error - Payload's locale parameter type doesn't match our string type
      locale,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        resourceId: {
          equals: resourceId,
        },
      },
    });

    return result.docs?.[0] ?? null;
  },
);
