import type * as Sentry from '@sentry/nextjs';

/**
 * Sentry is configured at runtime, not at build time, so one Docker image can be run
 * by anyone: with their own Sentry project, or without Sentry.
 *
 * - `SENTRY_DSN` turns Sentry on. Without it, nothing is sent.
 * - `SENTRY_ENVIRONMENT` (e.g. `staging`, `production`) names the environment.
 * - `SENTRY_SEND_DEFAULT_PII=true` lets the SDK send personal data (IP addresses,
 *   cookies, headers, request bodies). Off by default; see `sentryInitOptions`.
 *
 * The server and edge configs read these directly. The browser cannot read runtime
 * variables, so the frontend layout renders them into meta tags (see SentryConfigMeta)
 * and instrumentation-client reads them from there.
 *
 * The release is set at build time by `withSentryConfig` in next.config, from the
 * commit the image was built from, so events match the uploaded source maps.
 *
 * The earlier build-time variables (NEXT_PUBLIC_FEATURE_SENTRY with
 * NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII) still work as a
 * fallback, for local setups that have them in .env.
 */

export interface SentryRuntimeConfig {
  dsn: string;
  environment?: string;
  sendDefaultPii: boolean;
}

/** The meta tags that carry the configuration to the browser. */
export const SENTRY_META = {
  dsn: 'sentry-dsn',
  environment: 'sentry-environment',
  sendDefaultPii: 'sentry-send-default-pii',
} as const;

/** The configuration on the server and edge, or null when Sentry is off. */
export function sentryRuntimeConfig(): SentryRuntimeConfig | null {
  const legacyDsn =
    process.env.NEXT_PUBLIC_FEATURE_SENTRY === 'true' ? process.env.NEXT_PUBLIC_SENTRY_DSN : '';
  const dsn = process.env.SENTRY_DSN || legacyDsn;
  if (!dsn) return null;

  return {
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || undefined,
    sendDefaultPii:
      process.env.SENTRY_SEND_DEFAULT_PII === 'true' ||
      process.env.NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII === 'true',
  };
}

/**
 * What the SDK may collect when personal data is off. Sentry 11 replaced the one
 * `sendDefaultPii` switch with `dataCollection`, and collects everything unless told
 * otherwise, so the off state has to be spelled out. Headers, cookies, query strings
 * and bodies can all carry a person; stack frame variables and database queries can
 * too. The error hooks add what is needed for debugging (host, user agent, referer)
 * as tags themselves. With personal data on, the SDK's defaults apply.
 */
// The SDK does not export the type; it is read off `Sentry.init`.
type DataCollection = NonNullable<NonNullable<Parameters<typeof Sentry.init>[0]>['dataCollection']>;

const noPersonalData: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  stackFrameVariables: false,
};

/** The `Sentry.init` options for a configuration, the same on server, edge and browser. */
export function sentryInitOptions(config: SentryRuntimeConfig) {
  return {
    dsn: config.dsn,
    environment: config.environment,
    dataCollection: config.sendDefaultPii ? undefined : noPersonalData,
  };
}
