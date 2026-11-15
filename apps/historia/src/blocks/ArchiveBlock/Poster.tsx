import type { ReactNode } from 'react';
import { ArrowUpRight } from '@eventuras/ratio-ui/icons';
import { Link } from '@eventuras/ratio-ui-next';
import NextLink from 'next/link';
import { type TeaserCollection, type TeaserDocument, teaserFields } from '@/components/Teaser';
import styles from './Poster.module.css';

type StoryProps = {
  doc: TeaserDocument;
  relationTo: TeaserCollection;
  locale: string;
};

/** The first story on a large card: title and link on one side, its lead, large, on the other. */
export function PosterStory({
  doc,
  kicker,
  relationTo,
  locale,
}: StoryProps & { kicker?: string | null }) {
  const story = teaserFields(doc, relationTo, locale);
  if (!story) return null;
  const eyebrow = [kicker, story.eyebrow].filter(Boolean).join(' · ');

  return (
    <article className={styles.card}>
      <div className={styles.cardMain}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.cardTitle}>{story.title}</h2>
        <Link href={story.href} variant="button-primary">
          {locale === 'en' ? 'Read it' : 'Les saken'}
        </Link>
      </div>
      {story.lead && (
        <div className={styles.cardAside}>
          <p className={styles.cardLead}>{story.lead}</p>
        </div>
      )}
    </article>
  );
}

/** A very large italic heading over the titles, numbered, in two columns. */
export function NumberedList({
  id,
  title,
  description,
  allLink,
  docs,
  relationTo,
  locale,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  allLink?: { href: string; label: string };
  docs: TeaserDocument[];
  relationTo: TeaserCollection;
  locale: string;
}) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={styles.numbered}>
      <div className={styles.numberedHeader}>
        <h2 id={headingId} className={styles.numberedTitle}>
          {title}
        </h2>
        {(description || allLink) && (
          <div className={styles.numberedIntro}>
            {description}
            {allLink && (
              <Link href={allLink.href} variant="button-outline">
                {allLink.label}
              </Link>
            )}
          </div>
        )}
      </div>
      {docs.length > 0 && (
        <ol className={styles.numberedList}>
          {docs.map((doc, index) => {
            const story = teaserFields(doc, relationTo, locale);
            if (!story) return null;
            return (
              <li key={doc.id}>
                <NextLink href={story.href} className={styles.numberedItem}>
                  <span aria-hidden="true" className={styles.numeral}>
                    {index + 1}
                  </span>
                  <span className={styles.numberedItemTitle}>{story.title}</span>
                </NextLink>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** One story on a coloured band that runs the full width of the window. */
export function BandStory({ doc, relationTo, locale }: StoryProps) {
  const story = teaserFields(doc, relationTo, locale);
  if (!story) return null;

  return (
    <NextLink href={story.href} className={styles.band} data-archive-layout="band">
      <span aria-hidden="true" className={styles.bandRing} />
      <span className={styles.bandTop}>
        {story.eyebrow && <span className={styles.bandEyebrow}>{story.eyebrow}</span>}
        <ArrowUpRight aria-hidden="true" className={styles.bandArrow} strokeWidth={1} />
      </span>
      <h2 className={styles.bandTitle}>{story.title}</h2>
      {story.lead && <span className={styles.bandLead}>{story.lead}</span>}
    </NextLink>
  );
}
