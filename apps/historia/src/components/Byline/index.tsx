import { Avatar } from '@eventuras/ratio-ui/core/Avatar';
import Link from 'next/link';
import { getDocUrl } from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';
import type { Contributors, Person } from '@/payload-types';
import { getImageUrl } from '@/utilities/image';
import styles from './Byline.module.css';

const LABEL: Record<string, string> = { no: 'Bidragsytere', en: 'Contributors' };

/** The person's page, when it has the slug and resource ID a page needs. */
function personUrl(person: Person, locale: string): string | null {
  if (!person.slug || !person.resourceId) return null;
  return getDocUrl({
    locale,
    collection: 'persons',
    slug: person.slug,
    resourceId: person.resourceId,
  });
}

/**
 * The people behind a document, under its lead: each with their picture (or
 * initials), their name, linked to their page, and what they did, from the
 * contributor's role ("Tekst", "Foto"). Contributors whose person is not
 * populated are left out.
 *
 * The avatar is ratio-ui's, `decorative` since the name is next to it.
 */
export function Byline({
  contributors,
  locale,
}: {
  contributors?: Contributors | null;
  locale: string;
}) {
  const people = (contributors ?? []).flatMap((contributor) =>
    typeof contributor.person === 'object' && contributor.person?.name
      ? [{ id: contributor.id, person: contributor.person, role: contributor.role?.trim() }]
      : [],
  );
  if (people.length === 0) return null;

  return (
    <ul className={styles.byline} aria-label={LABEL[locale] ?? LABEL.en}>
      {people.map(({ id, person, role }) => {
        const url = personUrl(person, locale);
        return (
          <li key={id ?? person.id} className={styles.person}>
            <Avatar
              name={person.name ?? undefined}
              src={getImageUrl(person.image, 'thumbnail') ?? undefined}
              size="lg"
              decorative
            />
            <span className={styles.text}>
              {url ? (
                <Link href={url} className={styles.name}>
                  {person.name}
                </Link>
              ) : (
                <span className={styles.name}>{person.name}</span>
              )}
              {role && <span className={styles.role}>{role}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
