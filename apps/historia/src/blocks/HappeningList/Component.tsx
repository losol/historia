import type React from 'react';
import { createEventApiClient, type EventurasEvent } from '@eventuras/event-api-client';
import { Logger } from '@eventuras/logger';
import { Section } from '@eventuras/ratio-ui/layout/Section';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { DocTeaser } from '@/components/Teaser';
import { Teaser } from '@/components/Teaser/Teaser';
import { getEventurasEnv } from '@/lib/eventuras/config';
import { siteWhere } from '@/lib/siteWhere';
import { getCurrentWebsiteId } from '@/lib/website';
import type { Happening, HappeningListBlock as HappeningListBlockProps } from '@/payload-types';
import styles from './HappeningList.module.css';

const logger = Logger.create({
  namespace: 'historia:blocks:happening-list',
  context: { module: 'HappeningListBlock' },
});

const labels = {
  en: {
    none: 'No upcoming happenings.',
    unavailable: 'The happenings could not be loaded right now.',
  },
  no: {
    none: 'Ingen kommende arrangementer.',
    unavailable: 'Arrangementene kunne ikke hentes nå.',
  },
};

const intlLocale = (locale: string) => (locale === 'no' ? 'nb' : locale);

type ListOptions = { limit: number; includePast: boolean; locale: string };

/** The site's own happenings: the next ones first, or every one newest first with the past. */
async function siteHappenings({ limit, includePast, locale }: ListOptions): Promise<Happening[]> {
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

/** `3. nov. 2026`, or `3.–5. nov. 2026` for an event over several days. */
function formatDates(event: EventurasEvent, locale: string): string | null {
  const parse = (value: string | null) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const start = parse(event.dateStart);
  if (!start) return null;
  const end = parse(event.dateEnd);
  const format = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return end && end.getTime() !== start.getTime()
    ? format.formatRange(start, end)
    : format.format(start);
}

/**
 * Events from Eventuras, each linking to its page there, or null when Eventuras
 * cannot be reached. Cached for ten minutes, so a popular page does not hit
 * Eventuras on every view.
 */
async function eventurasEvents(
  collectionId: number | null | undefined,
  { limit, includePast }: ListOptions,
): Promise<EventurasEvent[] | null> {
  const env = getEventurasEnv();
  if (!env.enabled) {
    logger.warn('A happening list has Eventuras as its source, but EVENTURAS_* is not set');
    return [];
  }
  const client = createEventApiClient({
    apiUrl: env.apiUrl,
    siteUrl: env.siteUrl,
    organizationId: env.organizationId,
    fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 600 } }),
  });
  try {
    const page = await client.events.list({
      collectionId: collectionId ?? undefined,
      limit,
      includePast,
    });
    return page.items;
  } catch (error) {
    logger.error({ error, collectionId }, 'Failed to list events from Eventuras');
    return null;
  }
}

/**
 * Upcoming happenings as a compact list: the site's own by default, or events
 * from Eventuras. When Eventuras cannot be reached, the page still renders, with
 * a note instead of the list.
 */
export const HappeningListBlock: React.FC<
  HappeningListBlockProps & { id?: string; locale: string }
> = async ({ id, heading, source, collectionId, limit, includePast, locale }) => {
  const t = locale === 'en' ? labels.en : labels.no;
  const options: ListOptions = { limit: limit ?? 10, includePast: includePast ?? false, locale };

  let rows: React.ReactNode[] | null;
  if (source === 'eventuras') {
    const events = await eventurasEvents(collectionId, options);
    rows =
      events?.map((event) => (
        <Teaser
          key={event.uuid ?? event.id}
          variant="row"
          href={event.url}
          title={event.title}
          eyebrow={[formatDates(event, locale), event.city].filter(Boolean).join(' · ')}
          lead={event.headline}
        />
      )) ?? null;
  } else {
    const happenings = await siteHappenings(options);
    rows = happenings.map((doc) => (
      <DocTeaser
        key={doc.id}
        doc={doc}
        relationTo="happenings"
        locale={locale}
        variant="row"
        showImage={false}
      />
    ));
  }

  return (
    <Section id={`block-${id}`}>
      {heading && (
        <Section.Header>
          <Section.Title>{heading}</Section.Title>
        </Section.Header>
      )}
      {rows === null ? (
        <p>{t.unavailable}</p>
      ) : rows.length === 0 ? (
        <p>{t.none}</p>
      ) : (
        <div className={styles.list}>{rows}</div>
      )}
    </Section>
  );
};
