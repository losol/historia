import type React from 'react';
import { Section } from '@eventuras/ratio-ui/layout/Section';
import { Link } from '@eventuras/ratio-ui-next';
import configPromise from '@payload-config';
import { getPayload, type Where } from 'payload';
import { getLocalizedCollectionName } from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';
import RichText from '@/components/RichText';
import { DocTeaser, type TeaserCollection, type TeaserDocument } from '@/components/Teaser';
import { siteWhere } from '@/lib/siteWhere';
import { getCurrentWebsiteId } from '@/lib/website';
import type { ArchiveBlock as ArchiveBlockProps } from '@/payload-types';
import styles from './ArchiveBlock.module.css';

/** The newest articles first; happenings from the next one on. */
function orderFor(relationTo: TeaserCollection): { sort: string; where?: Where } {
  if (relationTo === 'articles') return { sort: '-publishedAt' };
  if (relationTo === 'happenings') {
    return { sort: 'startDate', where: { startDate: { greater_than_equal: new Date() } } };
  }
  return { sort: '-createdAt' };
}

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string;
    locale: string;
  }
> = async (props) => {
  const {
    id,
    title,
    description,
    layout,
    limit: limitFromProps,
    locale,
    relationTo,
    showAllLink,
    showImages,
    topics,
  } = props;

  const limit = limitFromProps || 5;

  let docs: TeaserDocument[] = [];

  const flattenedTopics =
    topics?.map((topic) => (typeof topic === 'object' ? topic.id : topic)) ?? [];

  const websiteId = relationTo ? await getCurrentWebsiteId() : null;

  if (relationTo && websiteId) {
    const payload = await getPayload({ config: configPromise });
    const order = orderFor(relationTo);

    // The site's published documents of the collection, by topic when topics are set
    const fetchedDocs = await payload.find({
      collection: relationTo,
      depth: 1,
      limit,
      sort: order.sort,
      // Titles and slugs are localized; without this the default locale's are listed.
      // @ts-expect-error - Payload's locale parameter type doesn't match our string type
      locale,
      where: {
        and: [
          siteWhere(payload, relationTo, websiteId),
          ...(order.where ? [order.where] : []),
          ...(flattenedTopics.length > 0 ? [{ topics: { in: flattenedTopics } }] : []),
        ],
      },
    });

    docs = fetchedDocs.docs;
  }

  if (docs.length === 0 && !description) return null;

  const listName = relationTo ? getLocalizedCollectionName(relationTo, locale) : '';
  const allLabel = locale === 'en' ? `All ${listName}` : `Alle ${listName}`;
  const [lead, ...rest] = docs;

  return (
    <Section id={`block-${id}`}>
      {(title || (showAllLink && relationTo)) && (
        <Section.Header>
          {title && <Section.Title>{title}</Section.Title>}
          {showAllLink && relationTo && (
            <Section.Link as={Link} href={`/${locale}/c/${listName}`}>
              {allLabel}
            </Section.Link>
          )}
        </Section.Header>
      )}
      {description && (
        <RichText className="ml-0 max-w-[48rem]" data={description} enableGutter={false} />
      )}
      {relationTo && layout === 'featured' && lead && (
        <div className={styles.featured}>
          <DocTeaser
            doc={lead}
            relationTo={relationTo}
            locale={locale}
            variant="lg"
            showImage={showImages ?? false}
          />
          {rest.length > 0 && (
            <div className={styles.list}>
              {rest.map((doc) => (
                <DocTeaser
                  key={doc.id}
                  doc={doc}
                  relationTo={relationTo}
                  locale={locale}
                  variant="row"
                  showImage={showImages ?? false}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {relationTo && layout === 'list' && docs.length > 0 && (
        <div className={styles.list}>
          {docs.map((doc) => (
            <DocTeaser
              key={doc.id}
              doc={doc}
              relationTo={relationTo}
              locale={locale}
              variant="row"
              showImage={showImages ?? false}
            />
          ))}
        </div>
      )}
      {relationTo && (!layout || layout === 'grid') && docs.length > 0 && (
        <div className={styles.grid}>
          {docs.map((doc) => (
            <DocTeaser
              key={doc.id}
              doc={doc}
              relationTo={relationTo}
              locale={locale}
              showImage={showImages ?? false}
            />
          ))}
        </div>
      )}
    </Section>
  );
};
