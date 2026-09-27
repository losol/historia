import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import { Logger } from '@eventuras/logger';
import { getPayload } from 'payload';
import config from '@/payload.config';

// Not a server action: only the server records that it created an order.

const logger = Logger.create({
  namespace: 'historia:checkout:vipps',
  context: { module: 'orderEvents' },
});

/**
 * Create a business event for automatic order creation
 * Used to track when webhook or callback successfully creates an order
 *
 * @param reference - Payment reference from Vipps
 * @param orderId - The created order ID
 * @param amount - Payment amount
 * @param source - Whether order was created by webhook or callback
 * @returns Success or error result
 */
export async function createOrderAutoCreatedEvent(
  reference: string,
  orderId: string,
  amount: { value: number; currency: string },
  source: 'webhook' | 'callback',
): Promise<ServerActionResult<void>> {
  try {
    logger.info(
      { reference, orderId, source },
      `Creating business event for order auto-created by ${source}`,
    );

    const payload = await getPayload({ config });

    // Create business event
    await payload.create({
      collection: 'business-events',
      data: {
        eventType: 'order.auto_created',
        source: source === 'webhook' ? 'vipps_webhook' : 'vipps_callback',
        externalReference: reference,
        data: {
          reference,
          orderId,
          amount,
          source,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logger.info(
      { reference, orderId, source },
      `Business event created for order auto-created by ${source}`,
    );

    return actionSuccess(undefined);
  } catch (error) {
    logger.error(
      { reference, orderId, source, error },
      'Failed to create business event for order auto-creation',
    );

    return actionError(error instanceof Error ? error.message : 'Failed to create business event');
  }
}
