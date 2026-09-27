'use server';

import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import { getCurrentSession } from '@eventuras/fides-auth-next';
import { Logger } from '@eventuras/logger';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { sessionOwnsPayment } from '@/lib/cart/paymentReference';
import type { SessionData } from '@/lib/cart/types';
import { getSessionContext } from '@/lib/session/sessionId';
import { createOrderFromPayment } from './createOrderFromPayment';

// The actions the return page calls. Creating the order itself lives in
// createOrderFromPayment.ts, which is not a server action: it takes the payment
// details as an argument, so it must never be callable from the browser.

const logger = Logger.create({
  namespace: 'historia:payment',
  context: { module: 'paymentCallbackActions' },
});

/**
 * Validate that the current user's session owns this payment reference
 * SECURITY: Prevents unauthorized access to payment status and order details
 *
 * Validation strategy:
 * 1. Primary: Check if cart exists in database with this paymentReference (ROBUST)
 * 2. Fallback: Check session's paymentReferences list (OPTIONAL - for performance)
 *
 * Database validation is preferred because:
 * - Works even if session expires or cookies are lost
 * - More reliable for slow payment completions
 * - Better for mobile where session handling can be problematic
 *
 * @param paymentReference - The payment reference to validate
 * @returns Success if payment is owned by current session or found in cart database
 */
async function validatePaymentOwnership(
  paymentReference: string,
): Promise<ServerActionResult<boolean>> {
  // Get session context for logging
  const sessionContext = await getSessionContext();

  try {
    // PRIMARY VALIDATION: Check database for cart with this paymentReference
    const payload = await getPayload({ config: configPromise });
    const carts = await payload.find({
      collection: 'carts',
      where: {
        paymentReference: {
          equals: paymentReference,
        },
      },
      limit: 1,
    });

    if (carts.docs.length > 0) {
      logger.info(
        {
          ...sessionContext,
          paymentReference,
          cartId: carts.docs[0].id,
        },
        'Payment validated via database cart lookup',
      );
      return actionSuccess(true);
    }

    // FALLBACK VALIDATION: Check session (optional, for performance)
    const session = await getCurrentSession();
    const sessionData = session?.data as SessionData | undefined;
    const paymentReferences = sessionData?.paymentReferences || [];

    if (paymentReferences.includes(paymentReference)) {
      logger.info(
        {
          ...sessionContext,
          paymentReference,
        },
        'Payment validated via session fallback',
      );
      return actionSuccess(true);
    }

    // Both validations failed
    logger.warn(
      {
        ...sessionContext,
        paymentReference,
        hasSession: !!session,
        paymentCount: paymentReferences.length,
      },
      'Payment reference not found in database or session - will trigger manual order creation',
    );

    return actionError('Unauthorized access to payment');
  } catch (error) {
    logger.error(
      {
        ...sessionContext,
        error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        paymentReference,
      },
      'CRITICAL: Error validating payment ownership',
    );
    return actionError('Failed to validate payment ownership');
  }
}

/**
 * Generate a secure random password for guest checkout users
 * Uses crypto.randomBytes for cryptographically strong random data
 */

/**
 * Check if an order already exists for a payment reference
 * Used to skip SSE and show success immediately when revisiting the page
 * SECURITY: Validates that the session owns this payment reference
 */
export async function checkExistingOrder(paymentReference: string): Promise<
  ServerActionResult<{
    exists: boolean;
    orderId?: string;
    transactionId?: string;
    userEmail?: string;
    shippingAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
  }>
> {
  logger.info({ paymentReference }, 'checkExistingOrder invoked');

  try {
    // Validate payment ownership
    const ownershipCheck = await validatePaymentOwnership(paymentReference);
    if (!ownershipCheck.success) {
      logger.warn(
        { paymentReference },
        'Session lost or unauthorized access - allowing normal flow with fallback recovery',
      );
      // Don't block the flow - let the normal payment processing handle it
      // with cart recovery via paymentReference fallback
      return actionSuccess({ exists: false });
    }

    const payload = await getPayload({ config: configPromise });

    // Check if transaction exists for this payment reference
    const existingTransactions = await payload.find({
      collection: 'transactions',
      where: {
        paymentReference: {
          equals: paymentReference,
        },
      },
      limit: 1,
    });

    if (existingTransactions.docs.length === 0) {
      return actionSuccess({ exists: false });
    }

    const transaction = existingTransactions.docs[0];

    // Handle case where transaction exists but order is not yet created
    if (!transaction.order) {
      logger.warn(
        { paymentReference, transactionId: transaction.id },
        'Transaction exists but no order created yet',
      );
      return actionSuccess({ exists: false });
    }

    const orderId =
      typeof transaction.order === 'string' ? transaction.order : transaction.order.id;

    // Fetch order details to get user email and shipping address
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId as string,
    });

    logger.info(
      {
        paymentReference,
        orderId,
        transactionId: transaction.id,
        exists: true,
      },
      'Found existing order for payment reference',
    );

    const showPersonalDetails = await sessionOwnsPayment(paymentReference);
    return actionSuccess({
      exists: true,
      orderId: orderId as string,
      transactionId: transaction.id as string,
      userEmail: (showPersonalDetails && order.userEmail) || undefined,
      shippingAddress:
        showPersonalDetails && order.shippingAddress
          ? {
              addressLine1: order.shippingAddress.addressLine1 || undefined,
              addressLine2: order.shippingAddress.addressLine2 || undefined,
              postalCode: order.shippingAddress.postalCode || undefined,
              city: order.shippingAddress.city || undefined,
              country: order.shippingAddress.country || undefined,
            }
          : undefined,
    });
  } catch (error) {
    logger.error(
      {
        error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        paymentReference,
      },
      'Error checking existing order - proceeding with normal flow',
    );
    // Return exists: false on error to allow normal flow to proceed
    return actionSuccess({ exists: false });
  }
}

/**
 * Process payment and create order (called from client when payment status changes)
 *
 * This server action:
 * 1. Validates payment ownership
 * 2. Fetches payment details from Vipps
 * 3. Creates order with createOrderFromPayment
 * 4. Returns order details with shipping info
 *
 * SECURITY: Validates that the session owns this payment reference
 */
export async function processPaymentAndCreateOrder(paymentReference: string): Promise<
  ServerActionResult<{
    orderId: string;
    transactionId: string;
    userEmail: string;
    shippingAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
  }>
> {
  logger.info({ paymentReference }, 'processPaymentAndCreateOrder invoked');

  try {
    // Validate payment ownership
    const ownershipCheck = await validatePaymentOwnership(paymentReference);
    if (!ownershipCheck.success) {
      logger.warn({ paymentReference }, 'Unauthorized attempt to process payment');
      return actionError('Unauthorized access');
    }

    logger.info({ paymentReference }, 'Processing payment and creating order');

    // Get Vipps config and fetch payment details (server-side only)
    const { getPaymentDetails } = await import('@eventuras/vipps/epayment-v1');
    const { getVippsConfig } = await import('@/lib/vipps/config');
    const vippsConfig = getVippsConfig();

    const paymentDetails = await getPaymentDetails(vippsConfig, paymentReference);

    logger.info({ paymentReference, state: paymentDetails.state }, 'Payment details retrieved');

    // Create order
    const orderResult = await createOrderFromPayment({
      paymentReference,
      paymentDetails,
    });

    if (!orderResult.success) {
      return actionError(orderResult.error.message);
    }

    // Return order details with shipping info, the personal part only to the session
    // that started the payment.
    const showPersonalDetails = await sessionOwnsPayment(paymentReference);
    return actionSuccess({
      orderId: orderResult.data.orderId,
      transactionId: orderResult.data.transactionId,
      userEmail: showPersonalDetails
        ? paymentDetails.profile?.email || paymentDetails.userDetails?.email || ''
        : '',
      shippingAddress:
        showPersonalDetails && paymentDetails.userDetails
          ? {
              addressLine1: paymentDetails.userDetails.streetAddress,
              postalCode: paymentDetails.userDetails.zipCode,
              city: paymentDetails.userDetails.city,
              country: paymentDetails.userDetails.country,
            }
          : undefined,
    });
  } catch (error) {
    logger.error(
      {
        error,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        paymentReference,
      },
      'CRITICAL: Error processing payment and creating order',
    );
    return actionError(error instanceof Error ? error.message : 'Failed to process payment');
  }
}
