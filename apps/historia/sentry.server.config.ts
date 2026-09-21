// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { setupOpenTelemetryLogger } from '@eventuras/logger/opentelemetry';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import * as Sentry from '@sentry/nextjs';

const isSentryEnabled = process.env.NEXT_PUBLIC_FEATURE_SENTRY === 'true';
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (isSentryEnabled && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information).
    // Can be controlled via NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII ('true' to enable, 'false' to disable).
    sendDefaultPii: process.env.NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII
      ? process.env.NEXT_PUBLIC_CMS_SENTRY_SEND_DEFAULT_PII === 'true'
      : true,
  });

  console.log('[Sentry] Server-side initialized successfully');
} else {
  console.log(
    `[Sentry] Server-side disabled (NEXT_PUBLIC_FEATURE_SENTRY=${process.env.NEXT_PUBLIC_FEATURE_SENTRY}, has DSN=${!!sentryDsn})`,
  );
}

// Set up OpenTelemetry logger integration
// The exporter reads the standard OTLP variables itself: the logs-specific
// OTEL_EXPORTER_OTLP_LOGS_ENDPOINT and _HEADERS (e.g. Sentry), or else the generic
// OTEL_EXPORTER_OTLP_ENDPOINT and _HEADERS with /v1/logs appended (e.g. the Aspire
// dashboard). Its header parsing also keeps values that contain `=`, such as Sentry's.
const otlpLogsEndpoint =
  process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (otlpLogsEndpoint) {
  setupOpenTelemetryLogger({
    logRecordProcessor: new BatchLogRecordProcessor({
      exporter: new OTLPLogExporter(),
    }),
  });

  console.log(`[OpenTelemetry] Logger initialized - sending to ${otlpLogsEndpoint}`);
} else {
  console.log(
    '[OpenTelemetry] Logger not configured (neither OTEL_EXPORTER_OTLP_LOGS_ENDPOINT nor OTEL_EXPORTER_OTLP_ENDPOINT is set)',
  );
}
