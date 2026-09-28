// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import {
  SENTRY_META,
  type SentryRuntimeConfig,
  sentryInitOptions,
} from '@/lib/observability/sentryOptions';

// The configuration comes from meta tags the server renders (SentryConfigMeta), so the
// same build can report to any Sentry project, or none. Pages without them, such as
// the Payload admin, do not report browser errors.
function readConfig(): SentryRuntimeConfig | null {
  const meta = (name: string) =>
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content || undefined;
  const dsn = meta(SENTRY_META.dsn);
  if (!dsn) return null;
  return {
    dsn,
    environment: meta(SENTRY_META.environment),
    sendDefaultPii: meta(SENTRY_META.sendDefaultPii) === 'true',
  };
}

function initSentry() {
  const config = readConfig();
  if (config) Sentry.init(sentryInitOptions(config));
}

// This can run before the head has been parsed; then wait for it.
if (readConfig() || document.readyState !== 'loading') {
  initSentry();
} else {
  document.addEventListener('DOMContentLoaded', initSentry, { once: true });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
