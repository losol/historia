# @eventuras/payload-event-api-client

Eventuras events in a Payload site: a small client for the public event API, and a block that lists events and links to their pages on the Eventuras site.

## The client

```ts
import { createEventApiClient } from '@eventuras/payload-event-api-client';

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

## The block

`EventListBlock` is a Payload block (`eventList`) with `heading`, `collectionId`, `limit` and `includePast`. The plugin adds it to the `story` field of the collections named:

```ts
eventApiClientPlugin({ collections: ['pages'] });
```

The package does not render the block: the site does, with its own components, through the client. Historia's `blocks/EventList/Component.tsx` is the example: it reads the Eventuras URLs from the environment, fetches the list when the page renders with a ten-minute cache, and shows a note instead of the list when Eventuras cannot be reached.
