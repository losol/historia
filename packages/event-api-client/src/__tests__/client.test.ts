import { describe, expect, it } from 'vitest';
import { createEventApiClient, EventApiError } from '../client';

const API = 'https://api.example.com';
const SITE = 'https://kurs.example.com';

const rawEvent = {
  id: 42,
  uuid: '0190a5b2-7c3e-7d4a-9b1f-2e6c8a4d1f03',
  slug: 'hjerte-lunge-redning',
  title: 'Hjerte-lunge-redning',
  headline: 'Et kurs',
  category: 'Kurs',
  type: 'Course',
  status: 'RegistrationsOpen',
  city: 'Losvik',
  location: 'Rådhuset',
  dateStart: '2026-11-03',
  dateEnd: '2026-11-03',
  lastRegistrationDate: '2026-11-01',
  onDemand: false,
  featuredImageUrl: 'https://cdn.example.com/a.jpg',
  published: true,
};

/** A fetch that records the request and answers with `body`. */
function fakeFetch(body: unknown, status = 200) {
  const calls: { url: URL; headers: Headers }[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

const client = (fetchImpl: typeof fetch, organizationId?: number) =>
  createEventApiClient({ apiUrl: API, siteUrl: SITE, organizationId, fetch: fetchImpl });

describe('events.list', () => {
  it('asks for the organisation, upcoming events, and maps what comes back', async () => {
    const { calls, fetchImpl } = fakeFetch({ page: 1, pages: 3, total: 25, data: [rawEvent] });
    const page = await client(fetchImpl, 7).events.list({ limit: 10 });

    const call = calls[0];
    expect(call?.url.pathname).toBe('/v3/events');
    expect(Object.fromEntries(call?.url.searchParams ?? [])).toEqual({
      OrganizationId: '7',
      Page: '1',
      Count: '10',
    });
    expect(call?.headers.get('Eventuras-Org-Id')).toBe('7');

    expect(page).toMatchObject({ page: 1, totalPages: 3, totalItems: 25 });
    expect(page.items[0]).toEqual({
      id: 42,
      uuid: '0190a5b2-7c3e-7d4a-9b1f-2e6c8a4d1f03',
      slug: 'hjerte-lunge-redning',
      title: 'Hjerte-lunge-redning',
      headline: 'Et kurs',
      category: 'Kurs',
      type: 'course',
      status: 'registrationsOpen',
      registrationOpen: true,
      city: 'Losvik',
      location: 'Rådhuset',
      dateStart: '2026-11-03',
      dateEnd: '2026-11-03',
      lastRegistrationDate: '2026-11-01',
      onDemand: false,
      featuredImageUrl: 'https://cdn.example.com/a.jpg',
      url: 'https://kurs.example.com/events/42/hjerte-lunge-redning',
    });
  });

  it('passes the collection and past events on, and clamps the limit', async () => {
    const { calls, fetchImpl } = fakeFetch({ data: [] });
    await client(fetchImpl).events.list({ collectionId: 3, includePast: true, limit: 500 });

    expect(Object.fromEntries(calls[0]?.url.searchParams ?? [])).toEqual({
      CollectionId: '3',
      IncludePastEvents: 'true',
      Page: '1',
      Count: '100',
    });
    expect(calls[0]?.headers.has('Eventuras-Org-Id')).toBe(false);
  });

  it('keeps unknown statuses and types from breaking the list', async () => {
    const { fetchImpl } = fakeFetch({
      data: [
        { ...rawEvent, status: 'SomethingNew', type: 'Webinar', slug: null },
        { title: 'no id' },
      ],
    });
    const page = await client(fetchImpl).events.list();

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      status: 'planned',
      type: 'other',
      registrationOpen: false,
      url: 'https://kurs.example.com/events/42/',
    });
  });

  it('throws an EventApiError with the status when the API refuses', async () => {
    const { fetchImpl } = fakeFetch({ error: 'nope' }, 500);
    await expect(client(fetchImpl).events.list()).rejects.toMatchObject({
      name: 'EventApiError',
      status: 500,
    });
  });

  it('throws an EventApiError with status 0 when the API is unreachable', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const error = await client(fetchImpl)
      .events.list()
      .catch((e) => e);
    expect(error).toBeInstanceOf(EventApiError);
    expect(error.status).toBe(0);
  });
});

describe('events.get', () => {
  it('returns the event', async () => {
    const { calls, fetchImpl } = fakeFetch(rawEvent);
    const event = await client(fetchImpl, 7).events.get(42);

    expect(calls[0]?.url.pathname).toBe('/v3/events/42');
    expect(event?.title).toBe('Hjerte-lunge-redning');
  });

  it('reads the event by uuid', async () => {
    const { calls, fetchImpl } = fakeFetch(rawEvent);
    const event = await client(fetchImpl).events.get('0190a5b2-7c3e-7d4a-9b1f-2e6c8a4d1f03');

    expect(calls[0]?.url.pathname).toBe('/v3/events/0190a5b2-7c3e-7d4a-9b1f-2e6c8a4d1f03');
    expect(event?.uuid).toBe('0190a5b2-7c3e-7d4a-9b1f-2e6c8a4d1f03');
  });

  it('has a null uuid from an Eventuras without one', async () => {
    const { uuid: _, ...withoutUuid } = rawEvent;
    const { fetchImpl } = fakeFetch(withoutUuid);
    expect((await client(fetchImpl).events.get(42))?.uuid).toBeNull();
  });

  it('returns null for an unknown id', async () => {
    const { fetchImpl } = fakeFetch({}, 404);
    expect(await client(fetchImpl).events.get(999)).toBeNull();
  });
});

describe('createEventApiClient', () => {
  it('rejects URLs that are not http(s)', () => {
    expect(() => createEventApiClient({ apiUrl: 'api.example.com', siteUrl: SITE })).toThrow(
      /apiUrl/,
    );
  });

  it('builds event URLs without double slashes', () => {
    const c = createEventApiClient({ apiUrl: `${API}/`, siteUrl: `${SITE}/` });
    expect(c.eventUrl({ id: 1, slug: 'a b' })).toBe('https://kurs.example.com/events/1/a%20b');
  });
});
