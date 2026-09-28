// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { setupOpenTelemetryLogger } from '@eventuras/logger/opentelemetry';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import * as Sentry from '@sentry/nextjs';
import { sentryInitOptions } from '@/lib/observability/sentryOptions';

const { enabled: isSentryEnabled, ...sentryOptions } = sentryInitOptions();

if (isSentryEnabled) {
  Sentry.init(sentryOptions);

  console.log(
    `[Sentry] Server-side initialized (environment=${sentryOptions.environment ?? 'production'})`,
  );
} else {
  console.log(
    `[Sentry] Server-side disabled (NEXT_PUBLIC_FEATURE_SENTRY=${process.env.NEXT_PUBLIC_FEATURE_SENTRY}, has DSN=${!!process.env.NEXT_PUBLIC_SENTRY_DSN})`,
  );
}

// Set up OpenTelemetry logger integration
// The exporter reads the standard OTLP variables itself: the logs-specific
// OTEL_EXPORTER_OTLP_LOGS_ENDPOINT and _HEADERS (e.g. Sentry), or else the generic
// OTEL_EXPORTER_OTLP_ENDPOINT and _HEADERS with /v1/logs appended (e.g. the Aspire
// dashboard). Its header parsing also keeps values that contain `=`, such as Sentry's.
const otlpEndpointVariable = [
  'OTEL_EXPORTER_OTLP_LOGS_ENDPOINT',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
].find((name) => process.env[name]);

if (otlpEndpointVariable) {
  setupOpenTelemetryLogger({
    logRecordProcessor: new BatchLogRecordProcessor({
      exporter: new OTLPLogExporter(),
    }),
  });

  // The variable, not a URL: from the generic one the exporter appends /v1/logs.
  console.log(
    `[OpenTelemetry] Log export configured from ${otlpEndpointVariable}=${process.env[otlpEndpointVariable]}`,
  );
} else {
  console.log(
    '[OpenTelemetry] Logger not configured (neither OTEL_EXPORTER_OTLP_LOGS_ENDPOINT nor OTEL_EXPORTER_OTLP_ENDPOINT is set)',
  );
}
