---
"@eventuras/historia": minor
---

Sentry is configured at runtime instead of being baked into the image, so the published image can be run by anyone: with their own Sentry project or without Sentry. Set `SENTRY_DSN` (and `SENTRY_ENVIRONMENT`, optionally `SENTRY_SEND_DEFAULT_PII=true`) in the environment. The frontend hands the DSN to the browser in meta tags, so browser errors now also report the right environment. The build no longer takes `NEXT_PUBLIC_FEATURE_SENTRY`, `NEXT_PUBLIC_SENTRY_DSN` or `NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII`; those still work as a fallback where they are set at runtime. **Deployments that use Sentry must set `SENTRY_DSN`**, or Sentry is off after upgrading. Browser errors in the Payload admin are no longer reported; server errors from it still are.
