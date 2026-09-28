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

// Customer details that must not leave the server with a report: Sentry is a third
// party, and the payment reference and order id are enough to look the rest up.
const PERSONAL_KEY = /(email|phone|mobile|address|firstname|lastname|givenname|familyname|^sub$)/i;

/** A copy of `value` with customer details replaced, at any depth. */
function withoutPersonalData(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => withoutPersonalData(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      PERSONAL_KEY.test(key) ? '[redacted]' : withoutPersonalData(entry, depth + 1),
    ]),
  );
}

/**
 * Report a failure where money or an order is at risk: a paid payment without an
 * order, an amount that does not match, a payment event that could not be processed.
 *
 * Always logged at error level, like any other error. When Sentry is set up (the
 * server config initialises it when SENTRY_DSN is set), it is also sent to Sentry as
 * an issue, so it can raise an alert: these
 * failures are caught and handled, so nothing else reaches Sentry for them.
 * Issues are grouped by area and message, not by the payment, so one broken path
 * is one issue with every payment it hit as an event. Customer details (email,
 * phone, address, names) in the context stay in the log and are not sent to Sentry.
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
      scope.setContext('details', withoutPersonalData(context) as Record<string, unknown>);

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
