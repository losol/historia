import type React from 'react';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { type ArchiveDocument, CollectionArchive } from '@/components/CollectionArchive';
import RichText from '@/components/RichText';
import { siteWhere } from '@/lib/siteWhere';
import { getCurrentWebsiteId } from '@/lib/website';
import type { ArchiveBlock as ArchiveBlockProps } from '@/payload-types';

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string;
    locale: string;
    showImages?: boolean;
  }
> = async (props) => {
  const { id, description, limit: limitFromProps, locale, relationTo, showImages, topics } = props;

  const limit = limitFromProps || 5;

  let docs: ArchiveDocument[] = [];

  const flattenedTopics =
    topics?.map((topic) => (typeof topic === 'object' ? topic.id : topic)) ?? [];

  const websiteId = relationTo ? await getCurrentWebsiteId() : null;

  if (relationTo && websiteId) {
    const payload = await getPayload({ config: configPromise });

    // The site's published documents of the collection, by topic when topics are set
    const fetchedDocs = await payload.find({
      collection: relationTo,
      depth: 1,
      limit,
      // Titles and slugs are localized; without this the default locale's are listed.
      // @ts-expect-error - Payload's locale parameter type doesn't match our string type
      locale,
      where: {
        and: [
          siteWhere(payload, relationTo, websiteId),
          ...(flattenedTopics.length > 0 ? [{ topics: { in: flattenedTopics } }] : []),
        ],
      },
    });

    docs = fetchedDocs.docs;
  }
  return (
    <div className="my-16" id={`block-${id}`}>
      {description && (
        <div className="mb-16">
          <RichText className="ml-0 max-w-[48rem]" data={description} enableGutter={false} />
        </div>
      )}
      {relationTo && (
        <CollectionArchive docs={docs} relationTo={relationTo} showImages={showImages} />
      )}
    </div>
  );
};
