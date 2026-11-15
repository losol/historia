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
import { BandStory, NumberedList, PosterStory } from './Poster';

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
    skip: skipFromProps,
    topics,
  } = props;

  const limit = limitFromProps || 5;
  const skip = Math.max(0, skipFromProps ?? 0);

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
      // The first `skip` are fetched too and left out below; find has no offset.
      limit: limit + skip,
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

    docs = fetchedDocs.docs.slice(skip);
  }

  if (docs.length === 0 && !description) return null;

  const listName = relationTo ? getLocalizedCollectionName(relationTo, locale) : '';
  const allLabel = locale === 'en' ? `All ${listName}` : `Alle ${listName}`;
  const [lead, ...rest] = docs;

  const allHref = `/${locale}/c/${listName}`;

  // The poster layouts draw their own heading, so they skip the section header.
  if (relationTo && layout === 'band') {
    return lead ? <BandStory doc={lead} relationTo={relationTo} locale={locale} /> : null;
  }

  if (relationTo && layout === 'numbered') {
    return (
      <NumberedList
        id={`block-${id}`}
        title={title || listName}
        description={
          description && <RichText className="m-0" data={description} enableGutter={false} />
        }
        allLink={showAllLink ? { href: allHref, label: allLabel } : undefined}
        docs={docs}
        relationTo={relationTo}
        locale={locale}
      />
    );
  }

  if (relationTo && layout === 'poster') {
    if (!lead) return null;
    return (
      <section id={`block-${id}`} data-archive-layout="poster">
        <PosterStory doc={lead} kicker={title} relationTo={relationTo} locale={locale} />
        {rest.length > 0 && (
          <div className={`${styles.list} ${styles.posterRest}`}>
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
      </section>
    );
  }

  return (
    <Section id={`block-${id}`}>
      {(title || (showAllLink && relationTo)) && (
        <Section.Header>
          {title && <Section.Title>{title}</Section.Title>}
          {showAllLink && relationTo && (
            <Section.Link as={Link} href={allHref}>
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
