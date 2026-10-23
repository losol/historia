# @eventuras/event-api-client

A small client for the public, anonymous part of the Eventuras event API: list events, read one. Nothing here needs a token, and nothing is stored.

```ts
import { createEventApiClient } from '@eventuras/event-api-client';

const eventuras = createEventApiClient({
  apiUrl: 'https://api.example.com',
  siteUrl: 'https://kurs.example.com', // where the event links go
  organizationId: 7,
});

const { items } = await eventuras.events.list({ limit: 10 });
items[0].url; // https://kurs.example.com/events/42/hjerte-lunge-redning
```

- `events.list({ collectionId, includePast, limit, page, signal })` returns a page of `EventurasEvent`: id, uuid, slug, title, headline, category, type, status, `registrationOpen`, city, location, dates, `featuredImageUrl` and `url`. Only published events; past ones only with `includePast`.
- `events.get(id)` returns one event by its numeric id or its uuid, or `null`. Links to the Eventuras site use the numeric id, which is what its event pages take.
- A failed request throws `EventApiError` with `status` (0 when the API could not be reached).
- `fetch` can be injected, e.g. one with Next's `revalidate`.

The types are the package's own, so the Eventuras API can change without breaking the sites.

Historia's `blocks/HappeningList` is the consumer: a block that lists happenings from the site itself or, as an option, from Eventuras through this client.
