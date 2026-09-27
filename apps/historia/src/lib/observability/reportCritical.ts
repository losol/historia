import type { Logger } from '@eventuras/logger';
import * as Sentry from '@sentry/nextjs';

/**
 * What a critical report is about, for grouping in Sentry and searching the logs.
 * `paymentReference` and `orderId` become Sentry tags so an issue can be found from
 * an order or a payment and the other way round.
 */
export type CriticalContext = {
  area: 'checkout' | 'payment-webhook' | 'orders';
  paymentReference?: string | null;
  orderId?: string | null;
} & Record<string, unknown>;

/**
 * Report a failure where money or an order is at risk: a paid payment without an
 * order, an amount that does not match, a payment event that could not be processed.
 *
 * Always logged at error level, like any other error. When Sentry is set up (the
 * server config initialises it only with NEXT_PUBLIC_FEATURE_SENTRY=true and a
 * DSN), it is also sent to Sentry as an issue, so it can raise an alert: these
 * failures are caught and handled, so nothing else reaches Sentry for them.
 * Issues are grouped by area and message, not by the payment, so one broken path
 * is one issue with every payment it hit as an event.
 */
export function reportCritical(
  logger: Logger,
  message: string,
  context: CriticalContext,
  error?: unknown,
): void {
  logger.error({ ...context, ...(error !== undefined && { error }) }, `CRITICAL: ${message}`);

  if (!Sentry.getClient()) return;

  try {
    Sentry.withScope((scope) => {
      scope.setLevel('fatal');
      scope.setFingerprint(['critical', context.area, message]);
      scope.setTag('area', context.area);
      if (context.paymentReference) scope.setTag('paymentReference', context.paymentReference);
      if (context.orderId) scope.setTag('orderId', context.orderId);
      scope.setContext('details', context);

      if (error instanceof Error) {
        scope.setExtra('message', message);
        Sentry.captureException(error);
      } else {
        if (error !== undefined) scope.setExtra('error', String(error));
        Sentry.captureMessage(message);
      }
    });
  } catch (sentryError) {
    // Reporting must never be what breaks the checkout.
    logger.warn({ error: sentryError }, 'Could not send critical report to Sentry');
  }
}
