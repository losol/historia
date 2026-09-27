'use server';

import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import { Logger } from '@eventuras/logger';
import { getPayload } from 'payload';
import { sessionOwnsPayment } from '@/lib/cart/paymentReference';
import config from '@/payload.config';

const logger = Logger.create({
  namespace: 'historia:checkout:vipps',
  context: { module: 'businessEvents' },
});

const FAILURE_REASONS = ['aborted', 'expired', 'terminated', 'unknown'] as const;

/**
 * Record that a payment failed, for the sales report.
 *
 * Called from the return page, so anyone can call it: only a reason from the known
 * list is stored, and only for a payment this session started.
 *
 * @param reference - Payment reference from Vipps
 * @param reason - aborted, expired, terminated; anything else is stored as unknown
 */
export async function createPaymentFailureEvent(
  reference: string,
  reason: string,
): Promise<ServerActionResult<void>> {
  const failureReason = (FAILURE_REASONS as readonly string[]).includes(reason)
    ? reason
    : 'unknown';

  if (typeof reference !== 'string' || !(await sessionOwnsPayment(reference))) {
    logger.warn({ reference }, 'Payment failure not recorded: payment not started by this session');
    return actionError('Unknown payment');
  }

  try {
    logger.info({ reference, failureReason }, 'Creating business event for failed payment');

    const payload = await getPayload({ config });

    // Create business event
    await payload.create({
      collection: 'business-events',
      data: {
        eventType: 'payment.failed',
        source: 'vipps',
        externalReference: reference,
        data: {
          reference,
          failureReason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logger.info({ reference, failureReason }, 'Business event created for failed payment');

    return actionSuccess(undefined);
  } catch (error) {
    logger.error(
      { reference, failureReason, error },
      'Failed to create business event for failed payment',
    );

    return actionError(error instanceof Error ? error.message : 'Failed to create business event');
  }
}
