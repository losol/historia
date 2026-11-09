/**
 * A small client for the public, anonymous part of the Eventuras event API:
 * listing events and reading one. Nothing here needs a token.
 */

import { Logger } from '@eventuras/logger';
import type {
  EventApiClientOptions,
  EventurasEvent,
  EventurasEventStatus,
  EventurasEventType,
  EventurasPage,
  ListEventsOptions,
} from './types';

const logger = Logger.create({
  namespace: 'event-api-client',
  context: { module: 'EventApiClient' },
});

/** A failed request to the Eventuras API. `status` is 0 when no answer came back. */
export class EventApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, options: { status: number; url: string; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = 'EventApiError';
    this.status = options.status;
    this.url = options.url;
  }
}

/** What the API returns, as far as this client reads it. */
interface RawEvent {
  id?: number;
  uuid?: string | null;
  slug?: string | null;
  title?: string | null;
  headline?: string | null;
  category?: string | null;
  type?: string | null;
  status?: string | null;
  city?: string | null;
  location?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  lastRegistrationDate?: string | null;
  onDemand?: boolean | null;
  featuredImageUrl?: string | null;
  published?: boolean | null;
}

interface RawPage {
  page?: number;
  count?: number;
  total?: number;
  pages?: number;
  data?: RawEvent[] | null;
}

const STATUS: Record<string, EventurasEventStatus> = {
  Draft: 'draft',
  Planned: 'planned',
  RegistrationsOpen: 'registrationsOpen',
  WaitingList: 'waitingList',
  RegistrationsClosed: 'registrationsClosed',
  Finished: 'finished',
  Archived: 'archived',
  Cancelled: 'cancelled',
};

const TYPE: Record<string, EventurasEventType> = {
  Course: 'course',
  Conference: 'conference',
  OnlineCourse: 'onlineCourse',
  Social: 'social',
  Other: 'other',
};

export interface EventApiClient {
  events: {
    /** Published events, upcoming unless `includePast`, one page at a time. */
    list(options?: ListEventsOptions): Promise<EventurasPage<EventurasEvent>>;
    /** One event by its numeric id or its uuid, or null when there is none. */
    get(id: number | string, options?: { signal?: AbortSignal }): Promise<EventurasEvent | null>;
  };
  /** The event's page on the Eventuras site. */
  eventUrl(event: Pick<EventurasEvent, 'id' | 'slug'>): string;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function createEventApiClient(options: EventApiClientOptions): EventApiClient {
  for (const key of ['apiUrl', 'siteUrl'] as const) {
    if (!/^https?:\/\//.test(options[key] ?? '')) {
      throw new Error(`Eventuras ${key} must be an http(s) URL, got "${options[key]}"`);
    }
  }
  const apiUrl = trimSlash(options.apiUrl);
  const siteUrl = trimSlash(options.siteUrl);
  const fetchImpl = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 10_000;

  const eventUrl = (event: Pick<EventurasEvent, 'id' | 'slug'>) =>
    `${siteUrl}/events/${event.id}/${encodeURIComponent(event.slug)}`;

  async function request<T>(
    path: string,
    query: Record<string, string | number | boolean | undefined>,
    organizationId: number | undefined,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = new URL(`${apiUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    signal?.addEventListener('abort', () => controller.abort(), { once: true });

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: {
          Accept: 'application/json',
          ...(organizationId !== undefined && { 'Eventuras-Org-Id': String(organizationId) }),
        },
        signal: controller.signal,
      });
    } catch (cause) {
      throw new EventApiError(`Could not reach the Eventuras API at ${url.origin}`, {
        status: 0,
        url: url.toString(),
        cause,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new EventApiError(`Eventuras API answered ${response.status} for ${path}`, {
        status: response.status,
        url: url.toString(),
      });
    }
    return (await response.json()) as T;
  }

  function toEvent(raw: RawEvent): EventurasEvent | null {
    if (typeof raw.id !== 'number') return null;
    const status = STATUS[raw.status ?? ''] ?? 'planned';
    const slug = raw.slug ?? '';
    return {
      id: raw.id,
      uuid: raw.uuid ?? null,
      slug,
      title: raw.title ?? '',
      headline: raw.headline ?? null,
      category: raw.category ?? null,
      type: TYPE[raw.type ?? ''] ?? 'other',
      status,
      registrationOpen: status === 'registrationsOpen' || status === 'waitingList',
      city: raw.city ?? null,
      location: raw.location ?? null,
      dateStart: raw.dateStart ?? null,
      dateEnd: raw.dateEnd ?? null,
      lastRegistrationDate: raw.lastRegistrationDate ?? null,
      onDemand: raw.onDemand ?? false,
      featuredImageUrl: raw.featuredImageUrl ?? null,
      url: eventUrl({ id: raw.id, slug }),
    };
  }

  return {
    eventUrl,
    events: {
      async list(listOptions = {}) {
        const organizationId = listOptions.organizationId ?? options.organizationId;
        const page = await request<RawPage>(
          '/v3/events',
          {
            OrganizationId: organizationId,
            CollectionId: listOptions.collectionId,
            IncludePastEvents: listOptions.includePast ? true : undefined,
            Page: Math.max(Math.trunc(listOptions.page ?? 1), 1),
            Count: Math.min(Math.max(Math.trunc(listOptions.limit ?? 20), 1), 100),
          },
          organizationId,
          listOptions.signal,
        );
        const items = (page.data ?? [])
          .map(toEvent)
          .filter((event): event is EventurasEvent => event !== null);
        logger.debug({ organizationId, count: items.length }, 'Listed events');
        return {
          items,
          page: page.page ?? 1,
          totalPages: page.pages ?? 1,
          totalItems: page.total ?? items.length,
        };
      },

      async get(id, getOptions = {}) {
        try {
          const raw = await request<RawEvent>(
            `/v3/events/${encodeURIComponent(String(id))}`,
            {},
            options.organizationId,
            getOptions.signal,
          );
          return toEvent(raw);
        } catch (error) {
          if (error instanceof EventApiError && error.status === 404) return null;
          throw error;
        }
      },
    },
  };
}
