---
'@eventuras/event-api-client': minor
---

New package: a client for the public Eventuras event API (list events, read one), with the package's own types. Events carry their `uuid` as well as the numeric id, and `events.get` takes either. A failed request throws `EventApiError`; `fetch` can be injected.
