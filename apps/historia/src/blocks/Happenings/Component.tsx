import type React from 'react';
import { Section } from '@eventuras/ratio-ui/layout/Section';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { DocTeaser } from '@/components/Teaser';
import { siteWhere } from '@/lib/siteWhere';
import { getCurrentWebsiteId } from '@/lib/website';
import type { Happening, HappeningsBlock as HappeningsBlockProps } from '@/payload-types';
import styles from './Happenings.module.css';

const labels = {
  en: { none: 'No upcoming happenings.' },
  no: { none: 'Ingen kommende arrangementer.' },
};

/** The site's happenings: the next ones first, or every one newest first with the past. */
async function happenings(options: {
  limit: number;
  includePast: boolean;
  locale: string;
}): Promise<Happening[]> {
  const { limit, includePast, locale } = options;
  const websiteId = await getCurrentWebsiteId();
  if (!websiteId) return [];
  const payload = await getPayload({ config: configPromise });
  const { docs } = await payload.find({
    collection: 'happenings',
    depth: 1,
    limit,
    sort: includePast ? '-startDate' : 'startDate',
    // Titles and slugs are localized; without this the default locale's are listed.
    // @ts-expect-error - Payload's locale parameter type doesn't match our string type
    locale,
    where: {
      and: [
        siteWhere(payload, 'happenings', websiteId),
        ...(includePast ? [] : [{ startDate: { greater_than_equal: new Date() } }]),
      ],
    },
  });
  return docs;
}

/** The site's upcoming happenings as a compact list of teaser rows. */
export const HappeningsBlock: React.FC<
  HappeningsBlockProps & { id?: string; locale: string }
> = async ({ id, heading, limit, includePast, locale }) => {
  const t = locale === 'en' ? labels.en : labels.no;
  const docs = await happenings({
    limit: limit ?? 10,
    includePast: includePast ?? false,
    locale,
  });

  return (
    <Section id={`block-${id}`}>
      {heading && (
        <Section.Header>
          <Section.Title>{heading}</Section.Title>
        </Section.Header>
      )}
      {docs.length === 0 ? (
        <p>{t.none}</p>
      ) : (
        <div className={styles.list}>
          {docs.map((doc) => (
            <DocTeaser
              key={doc.id}
              doc={doc}
              relationTo="happenings"
              locale={locale}
              variant="row"
              showImage={false}
            />
          ))}
        </div>
      )}
    </Section>
  );
};
