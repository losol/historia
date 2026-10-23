import type React from 'react';
import { Logger } from '@eventuras/logger';
import { createEventApiClient, type EventurasEvent } from '@eventuras/payload-event-api-client';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Teaser } from '@/components/Teaser/Teaser';
import { getEventurasEnv } from '@/lib/eventuras/config';
import type { EventListBlock as EventListBlockProps } from '@/payload-types';

const logger = Logger.create({
  namespace: 'historia:blocks:event-list',
  context: { module: 'EventListBlock' },
});

const labels = {
  en: { none: 'No upcoming events.', unavailable: 'The events could not be loaded right now.' },
  no: {
    none: 'Ingen kommende arrangementer.',
    unavailable: 'Arrangementene kunne ikke hentes nå.',
  },
};

const intlLocale = (locale: string) => (locale === 'no' ? 'nb' : locale);

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
 * Upcoming events from Eventuras, each linking to its page on the Eventuras site.
 * The list is fetched when the page renders and cached for ten minutes; when
 * Eventuras cannot be reached, the page still renders, with a note instead.
 */
export const EventListBlock: React.FC<
  EventListBlockProps & { id?: string; locale: string }
> = async ({ id, heading, collectionId, limit, includePast, locale }) => {
  const t = locale === 'en' ? labels.en : labels.no;
  const env = getEventurasEnv();
  if (!env.enabled) return null;

  const client = createEventApiClient({
    apiUrl: env.apiUrl,
    siteUrl: env.siteUrl,
    organizationId: env.organizationId,
    // Next caches the answer, so a popular page does not hit Eventuras on every view.
    fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 600 } }),
  });

  let events: EventurasEvent[] | null = null;
  try {
    const page = await client.events.list({
      collectionId: collectionId ?? undefined,
      limit: limit ?? 10,
      includePast: includePast ?? false,
    });
    events = page.items;
  } catch (error) {
    logger.error({ error, collectionId }, 'Failed to list events from Eventuras');
  }

  return (
    <section className="my-16" id={`block-${id}`}>
      {heading && (
        <Heading as="h2" className="mb-6">
          {heading}
        </Heading>
      )}
      {events === null ? (
        <p>{t.unavailable}</p>
      ) : events.length === 0 ? (
        <p>{t.none}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <Teaser
              key={event.id}
              variant="row"
              href={event.url}
              title={event.title}
              eyebrow={[formatDates(event, locale), event.city].filter(Boolean).join(' · ')}
              lead={event.headline}
            />
          ))}
        </div>
      )}
    </section>
  );
};
