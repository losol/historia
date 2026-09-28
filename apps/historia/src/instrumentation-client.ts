// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { sentryInitOptions } from '@/lib/observability/sentryOptions';

const { enabled: isSentryEnabled, ...sentryOptions } = sentryInitOptions();

if (isSentryEnabled) {
  Sentry.init(sentryOptions);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
