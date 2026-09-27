'use server';

import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import type { Session } from '@eventuras/fides-auth-next';
import { createSession, getCurrentSession, setSessionCookie } from '@eventuras/fides-auth-next';
import { Logger } from '@eventuras/logger';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import type { Cart, CartItem, SessionData } from '@/lib/cart/types';
import {
  findPurchasableProducts,
  isValidProductId,
  isValidQuantity,
  MAX_ITEM_QUANTITY,
} from '@/lib/commerce/cartValidation';
import { getCurrentWebsiteId } from '@/lib/website';

const logger = Logger.create({
  namespace: 'historia:cart-actions',
  context: { module: 'CartActions' },
});

const CART_EXPIRY_HOURS = 24;

/**
 * Get the current cart from the encrypted session
 */
export async function getCart(): Promise<Cart | null> {
  try {
    const session = await getCurrentSession();

    if (!session?.data?.cart) {
      logger.debug('No cart in session');
      return null;
    }

    // Check if cart has expired
    const expiresAt = new Date(session.data.cart.expiresAt);
    if (expiresAt < new Date()) {
      logger.info('Cart expired, clearing');
      await clearCart();
      return null;
    }

    logger.debug({ itemCount: session.data.cart.items.length }, 'Retrieved cart from session');
    return session.data.cart;
  } catch (error) {
    logger.error({ error }, 'Error getting cart');
    return null;
  }
}

/**
 * The cart, without lines that can no longer be bought: a product unpublished,
 * deleted or moved to another website since it was added. Those lines are removed
 * from the session too, so the count in the header, the drawer and the checkout
 * agree, and `removedProductIds` lets the page tell the customer.
 *
 * Nothing is removed when the check cannot be made (no website for this host, the
 * database unreachable): a cart is only pruned on a definite answer, never emptied
 * because of an outage.
 */
export async function getValidatedCart(): Promise<
  ServerActionResult<{ cart: Cart | null; removedProductIds: string[] }>
> {
  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return actionSuccess({ cart, removedProductIds: [] });
  }

  try {
    const websiteId = await getCurrentWebsiteId();
    if (!websiteId) {
      logger.warn('Cart not validated: no website for this host');
      return actionSuccess({ cart, removedProductIds: [] });
    }

    const payload = await getPayload({ config: configPromise });
    const products = await findPurchasableProducts(
      payload,
      cart.items.map((item) => item.productId),
      websiteId,
    );
    const purchasable = new Set(products.map((product) => product.id));
    const removedProductIds = cart.items
      .filter((item) => !purchasable.has(item.productId) || !isValidQuantity(item.quantity))
      .map((item) => item.productId);

    if (removedProductIds.length === 0) {
      return actionSuccess({ cart, removedProductIds });
    }

    const session = await getCurrentSession();
    const updatedCart: Cart = {
      ...cart,
      items: cart.items.filter((item) => !removedProductIds.includes(item.productId)),
      paymentReference: undefined,
    };
    const updatedSession: Session<SessionData> = {
      ...session,
      data: { ...session?.data, cart: updatedCart },
    };
    await setSessionCookie(await createSession(updatedSession));

    logger.info(
      { removedProductIds, remainingItems: updatedCart.items.length },
      'Removed lines that can no longer be bought from the cart',
    );
    return actionSuccess({ cart: updatedCart, removedProductIds });
  } catch (error) {
    logger.error({ error }, 'Could not validate cart - keeping it unchanged');
    return actionSuccess({ cart, removedProductIds: [] });
  }
}

/**
 * Add an item to the cart
 */
export async function addToCart(
  productId: string,
  quantity: number,
): Promise<ServerActionResult<Cart>> {
  try {
    logger.info({ productId, quantity }, 'Adding item to cart');

    // Server actions can be called with any arguments, not only from our buttons.
    if (!isValidProductId(productId) || !isValidQuantity(quantity)) {
      logger.warn({ productId, quantity }, 'Rejected add to cart: invalid product id or quantity');
      return actionError('Invalid product or quantity');
    }

    const payload = await getPayload({ config: configPromise });
    const [product] = await findPurchasableProducts(
      payload,
      [productId],
      await getCurrentWebsiteId(),
    );
    if (!product) {
      logger.warn({ productId }, 'Rejected add to cart: product is not for sale on this website');
      return actionError('This product is not available');
    }

    const session = await getCurrentSession();
    const existingCart = session?.data?.cart;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CART_EXPIRY_HOURS * 60 * 60 * 1000);

    // Find if item already exists in cart
    const existingItems = existingCart?.items || [];
    const existingItemIndex = existingItems.findIndex(
      (item: CartItem) => item.productId === productId,
    );

    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const newQuantity = existingItems[existingItemIndex].quantity + quantity;
      if (!isValidQuantity(newQuantity)) {
        logger.warn(
          { productId, currentQuantity: existingItems[existingItemIndex].quantity, quantity },
          'Rejected add to cart: line would exceed the maximum quantity',
        );
        return actionError(`At most ${MAX_ITEM_QUANTITY} of one product`);
      }
      updatedItems = [...existingItems];
      updatedItems[existingItemIndex] = { productId, quantity: newQuantity };
      logger.info(
        { productId, newQuantity: updatedItems[existingItemIndex].quantity },
        'Updated existing cart item',
      );
    } else {
      // Add new item
      updatedItems = [...existingItems, { productId, quantity }];
      logger.info({ productId, quantity }, 'Added new cart item');
    }

    const updatedCart: Cart = {
      items: updatedItems,
      createdAt: existingCart?.createdAt || now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      // Clear payment reference when cart contents change
      paymentReference: undefined,
    };

    const updatedSession: Session<SessionData> = {
      ...session,
      data: {
        ...session?.data,
        cart: updatedCart,
      },
    };

    try {
      const jwt = await createSession(updatedSession);
      await setSessionCookie(jwt);
    } catch (sessionError) {
      logger.error({ error: sessionError, updatedCart }, 'Failed to create session');
      throw sessionError;
    }

    logger.info({ itemCount: updatedCart.items.length }, 'Cart updated successfully');
    return actionSuccess(updatedCart);
  } catch (error) {
    logger.error({ error, productId, quantity }, 'Error adding to cart');
    return actionError('Failed to add item to cart');
  }
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItem(
  productId: string,
  quantity: number,
): Promise<ServerActionResult<Cart>> {
  try {
    logger.info({ productId, quantity }, 'Updating cart item');

    // 0 removes the line; anything else must be a valid quantity.
    if (!isValidProductId(productId) || (quantity !== 0 && !isValidQuantity(quantity))) {
      logger.warn({ productId, quantity }, 'Rejected cart update: invalid product id or quantity');
      return actionError('Invalid product or quantity');
    }

    const session = await getCurrentSession();
    const existingCart = session?.data?.cart;

    if (!existingCart?.items) {
      return actionError('Cart is empty');
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      return await removeFromCart(productId);
    }

    const updatedItems = existingCart.items.map((item: CartItem) =>
      item.productId === productId ? { productId, quantity } : item,
    );

    const updatedCart: Cart = {
      ...existingCart,
      items: updatedItems,
      // Clear payment reference when cart contents change
      paymentReference: undefined,
    };

    const updatedSession: Session<SessionData> = {
      ...session,
      data: {
        ...session?.data,
        cart: updatedCart,
      },
    };

    const jwt = await createSession(updatedSession);
    await setSessionCookie(jwt);

    logger.info({ productId, quantity }, 'Cart item updated successfully');
    return actionSuccess(updatedCart);
  } catch (error) {
    logger.error({ error, productId, quantity }, 'Error updating cart item');
    return actionError('Failed to update cart item');
  }
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(productId: string): Promise<ServerActionResult<Cart>> {
  try {
    logger.info({ productId }, 'Removing item from cart');

    const session = await getCurrentSession();
    const existingCart = session?.data?.cart;

    if (!existingCart?.items) {
      return actionError('Cart is empty');
    }

    const updatedItems = existingCart.items.filter(
      (item: CartItem) => item.productId !== productId,
    );

    const updatedCart: Cart = {
      ...existingCart,
      items: updatedItems,
      // Clear payment reference when cart contents change
      paymentReference: undefined,
    };

    const updatedSession: Session<SessionData> = {
      ...session,
      data: {
        ...session?.data,
        cart: updatedCart,
      },
    };

    const jwt = await createSession(updatedSession);
    await setSessionCookie(jwt);

    logger.info({ productId, remainingItems: updatedItems.length }, 'Item removed from cart');
    return actionSuccess(updatedCart);
  } catch (error) {
    logger.error({ error, productId }, 'Error removing from cart');
    return actionError('Failed to remove item from cart');
  }
}

/**
 * Clear all items from the cart
 */
export async function clearCart(): Promise<ServerActionResult<void>> {
  try {
    logger.info('Clearing cart');

    const session = await getCurrentSession();

    const updatedSession: Session<SessionData> = {
      ...session,
      data: {
        ...session?.data,
        cart: undefined,
        paymentReferences: undefined, // Clear payment references when cart is cleared
      },
    };

    const jwt = await createSession(updatedSession);
    await setSessionCookie(jwt);

    logger.info('Cart and payment references cleared successfully');
    return actionSuccess(undefined);
  } catch (error) {
    logger.error({ error }, 'Error clearing cart');
    return actionError('Failed to clear cart');
  }
}

/**
 * Empty the cart once its payment has become an order.
 *
 * Only a cart that still belongs to that payment is emptied: any change to the cart
 * clears its paymentReference, so a cart filled again (in another tab, or after the
 * payment was started) is left alone. The session's list of payment references is
 * kept, so the confirmation page can still show the order's details on a reload.
 */
export async function clearCartAfterPayment(
  reference: string,
): Promise<ServerActionResult<{ cleared: boolean }>> {
  try {
    const session = await getCurrentSession();
    const cart = session?.data?.cart;

    if (!cart || cart.paymentReference !== reference) {
      logger.info(
        { reference, cartReference: cart?.paymentReference, hasCart: !!cart },
        'Cart not cleared after payment: it no longer belongs to this payment',
      );
      return actionSuccess({ cleared: false });
    }

    const updatedSession: Session<SessionData> = {
      ...session,
      data: {
        ...session?.data,
        cart: undefined,
      },
    };
    await setSessionCookie(await createSession(updatedSession));

    logger.info({ reference }, 'Cart cleared after payment');
    return actionSuccess({ cleared: true });
  } catch (error) {
    logger.error({ error, reference }, 'Error clearing cart after payment');
    return actionError('Failed to clear cart');
  }
}
