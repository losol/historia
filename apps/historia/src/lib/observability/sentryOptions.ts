/**
 * The Sentry settings shared by the server, edge and browser configs, so the three
 * cannot drift apart.
 *
 * - `NEXT_PUBLIC_FEATURE_SENTRY=true` and `NEXT_PUBLIC_SENTRY_DSN` turn Sentry on.
 *   Both are baked into the build (the browser gets them that way).
 * - `SENTRY_ENVIRONMENT` (e.g. `staging`, `production`) is read at runtime on the
 *   server, since one image is promoted from staging to production. The browser
 *   cannot read it and reports the SDK default.
 * - The release is set at build time by `withSentryConfig` in next.config, from the
 *   commit the image was built from, so events match the uploaded source maps.
 * - Customer details are not sent unless NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII=true.
 */
export function sentryInitOptions() {
  const enabled =
    process.env.NEXT_PUBLIC_FEATURE_SENTRY === 'true' && !!process.env.NEXT_PUBLIC_SENTRY_DSN;

  return {
    enabled,
    dsn: enabled ? process.env.NEXT_PUBLIC_SENTRY_DSN : undefined,
    environment: process.env.SENTRY_ENVIRONMENT || undefined,
    enableLogs: true,
    sendDefaultPii: process.env.NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII === 'true',
  };
}
