---
'@eventuras/historia': patch
---

Turn Sentry on in the built image. `NEXT_PUBLIC_FEATURE_SENTRY` gates every `Sentry.init()` call, the Dockerfile defaults it to `false`, and the Docker workflow never passed it — so every image shipped with Sentry inert while the DSN, org, project and source-map upload were all wired up correctly. Nothing was reporting. The build arg is now passed, tied to whether a DSN is configured, since without one each Sentry config skips init anyway.

Sending user PII from the server is now opt-in. `sentry.server.config.ts` fell back to `sendDefaultPii: true` when `NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII` was unset, unlike the client and edge configs, which fall back to `false` — and the runtime image never carried that variable, so the fallback was what the server actually used. Enabling Sentry without this would have started sending PII unasked. The runtime stage now carries the variable too, so the server reads the value that was configured rather than falling back at all.
