import { SENTRY_META, sentryRuntimeConfig } from '@/lib/observability/sentryOptions';

/**
 * Hands the runtime Sentry configuration to the browser as meta tags, which
 * instrumentation-client reads. Renders nothing when Sentry is off. The DSN is not a
 * secret: it only allows sending events, and the browser needs it to report errors.
 */
export function SentryConfigMeta() {
  const config = sentryRuntimeConfig();
  if (!config) return null;

  return (
    <>
      <meta name={SENTRY_META.dsn} content={config.dsn} />
      {config.environment && <meta name={SENTRY_META.environment} content={config.environment} />}
      {config.sendDefaultPii && <meta name={SENTRY_META.sendDefaultPii} content="true" />}
    </>
  );
}
