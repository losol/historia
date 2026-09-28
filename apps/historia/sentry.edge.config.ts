// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { sentryInitOptions } from '@/lib/observability/sentryOptions';

const { enabled: isSentryEnabled, ...sentryOptions } = sentryInitOptions();

if (isSentryEnabled) {
  Sentry.init(sentryOptions);

  console.log('[Sentry] Edge runtime initialized successfully');
} else {
  console.log(
    `[Sentry] Edge runtime disabled (NEXT_PUBLIC_FEATURE_SENTRY=${process.env.NEXT_PUBLIC_FEATURE_SENTRY}, has DSN=${!!process.env.NEXT_PUBLIC_SENTRY_DSN})`,
  );
}
