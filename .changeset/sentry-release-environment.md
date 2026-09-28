---
"@eventuras/historia": patch
---

Sentry: source maps are uploaded from the Docker build again. The build exported the auth token under a name Sentry does not read. Events carry the commit as release, and the server reports under `SENTRY_ENVIRONMENT` (e.g. staging or production), read at runtime. Server, edge and browser share one set of init options. The Payload error hook sends the IP address only with the PII opt-in. System admins can open `/api/sentry-check` to send a test event and see whether Sentry is on.
