# @eventuras/event-api-client

## 0.1.0

### Minor Changes

- a94812f: New package: a client for the public Eventuras event API (list events, read one), with the package's own types. Events carry their `uuid` as well as the numeric id, and `events.get` takes either. A failed request throws `EventApiError`; `fetch` can be injected.
