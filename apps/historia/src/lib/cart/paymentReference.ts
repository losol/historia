import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import type { Session } from '@eventuras/fides-auth-next';
import { createSession, getCurrentSession, setSessionCookie } from '@eventuras/fides-auth-next';
import { Logger } from '@eventuras/logger';
import type { Cart, SessionData } from './types';

// Not server actions. A payment reference in the session is what lets a visitor see
// the order's personal details and its payment status, so only the server may add
// one: when it has created that payment for this session's cart.

const logger = Logger.create({
  namespace: 'historia:cart',
  context: { module: 'paymentReference' },
});

/**
 * Set the payment reference in the cart session
 * Called when initiating Vipps payment to link cart with payment
 * SECURITY: Adds reference to encrypted session for access control
 */
export async function setCartPaymentReference(
  reference: string,
): Promise<ServerActionResult<void>> {
  try {
    logger.info({ reference }, 'Setting payment reference in cart');

    const session = await getCurrentSession();
    const existingCart = session?.data?.cart;

    if (!existingCart?.items || existingCart.items.length === 0) {
      return actionError('Cart is empty');
    }

    // Get existing payment references from session
    const existingReferences = session?.data?.paymentReferences || [];

    // Add new reference if not already present
    const paymentReferences = existingReferences.includes(reference)
      ? existingReferences
      : [...existingReferences, reference];

    const updatedCart: Cart = {
      ...existingCart,
      paymentReference: reference,
    };

    const updatedSession: Session<SessionData> = {
      ...session,
      data: {
        ...session?.data,
        cart: updatedCart,
        paymentReferences,
      },
    };

    const jwt = await createSession(updatedSession);
    await setSessionCookie(jwt);

    logger.info(
      { reference, totalReferences: paymentReferences.length },
      'Payment reference set and added to session',
    );
    return actionSuccess(undefined);
  } catch (error) {
    logger.error({ error, reference }, 'Error setting payment reference');
    return actionError('Failed to set payment reference');
  }
}

/**
 * Whether this visitor's session started the payment. The reference alone (from the
 * return URL) is enough to see that an order exists and to have it created: it is an
 * unguessable UUID, and the customer may come back in another browser than the one
 * they paid from. The customer's email and address are only shown to the session that
 * started the payment, not to anyone holding a copied link or the browser history.
 */
export async function sessionOwnsPayment(paymentReference: string): Promise<boolean> {
  try {
    const session = await getCurrentSession();
    const sessionData = session?.data as SessionData | undefined;
    return (
      sessionData?.cart?.paymentReference === paymentReference ||
      (sessionData?.paymentReferences ?? []).includes(paymentReference)
    );
  } catch (error) {
    logger.warn({ error, paymentReference }, 'Could not read session to check payment ownership');
    return false;
  }
}
