'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { actionError, type ServerActionResult } from '@eventuras/core-nextjs/actions';
import { Logger } from '@eventuras/logger';
import {
  addToCart as addToCartAction,
  clearCart as clearCartAction,
  clearCartAfterPayment as clearCartAfterPaymentAction,
  getCart as getCartAction,
  getValidatedCart as getValidatedCartAction,
  removeFromCart as removeFromCartAction,
  updateCartItem as updateCartItemAction,
} from '@/app/actions/cart';
import { MAX_ITEM_QUANTITY } from '@/lib/commerce/cartValidation';
import type { Cart, CartItem } from './types';

const logger = Logger.create({
  namespace: 'historia:cart',
  context: { module: 'useSessionCart' },
});

/** The lines after setting one product's quantity; 0 removes it. */
function withQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((item) => item.productId !== productId);
  if (!items.some((item) => item.productId === productId)) {
    return [...items, { productId, quantity }];
  }
  return items.map((item) => (item.productId === productId ? { productId, quantity } : item));
}

/**
 * React hook for the cart kept in the encrypted session. Use it through `useCart()`,
 * so every component on the page shares one cart.
 *
 * Changes show at once and are sent to the server one after another. Each click is
 * computed from what the customer sees, not from the last server answer, so fast
 * clicks are not lost, and the server gets the changes in the order they were made.
 * While any change is on its way, `pending` is true: checkout must wait for it, since
 * the payment is priced from the cart on the server. When a change fails, the cart
 * is reloaded from the server once the queue is empty.
 */
export function useSessionCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  // Lines as the customer sees them while changes are on their way to the server.
  const [optimisticItems, setOptimisticItems] = useState<CartItem[] | null>(null);
  const [pending, setPending] = useState(false);
  // Products removed on load because they can no longer be bought.
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);

  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingCountRef = useRef(0);
  const needsReloadRef = useRef(false);
  const latestServerCartRef = useRef<Cart | null>(null);
  const itemsRef = useRef<CartItem[]>([]);

  const items = optimisticItems ?? cart?.items ?? [];
  itemsRef.current = items;

  // Load and validate the cart on mount.
  useEffect(() => {
    async function loadCart() {
      try {
        const result = await getValidatedCartAction();
        if (result.success) {
          setCart(result.data.cart);
          if (result.data.removedProductIds.length > 0) {
            setRemovedProductIds(result.data.removedProductIds);
          }
        } else {
          logger.error({ error: result.error }, 'Failed to load cart from session');
        }
      } catch (error) {
        logger.error({ error }, 'Failed to load cart from session');
        setCart(null);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  const reloadCart = useCallback(async () => {
    try {
      const sessionCart = await getCartAction();
      setCart(sessionCart);
      logger.debug({ itemCount: sessionCart?.items.length || 0 }, 'Cart reloaded');
    } catch (error) {
      logger.error({ error }, 'Failed to reload cart');
    }
  }, []);

  /**
   * Show `nextItems` now, and queue `send` to make the same change on the server.
   * The server's answer replaces what is shown only once no other change is waiting,
   * so a slow answer never undoes a later click.
   */
  const mutate = useCallback(
    (
      nextItems: CartItem[],
      send: () => Promise<ServerActionResult<Cart>>,
      context: Record<string, unknown>,
    ): Promise<ServerActionResult<Cart>> => {
      setOptimisticItems(nextItems);
      itemsRef.current = nextItems;
      pendingCountRef.current += 1;
      setPending(true);

      const run = queueRef.current.then(async () => {
        let result: ServerActionResult<Cart>;
        try {
          result = await send();
        } catch (error) {
          logger.error({ error, ...context }, 'Cart change could not reach the server');
          result = actionError('Failed to update cart');
        }

        if (result.success) {
          latestServerCartRef.current = result.data;
        } else {
          logger.error({ error: result.error, ...context }, 'Cart change failed');
          needsReloadRef.current = true;
        }

        pendingCountRef.current -= 1;
        if (pendingCountRef.current === 0) {
          if (needsReloadRef.current) {
            needsReloadRef.current = false;
            await reloadCart();
          } else {
            setCart(latestServerCartRef.current);
          }
          setOptimisticItems(null);
          setPending(false);
        }
        return result;
      });

      queueRef.current = run;
      return run;
    },
    [reloadCart],
  );

  const addToCart = useCallback(
    (productId: string, quantity: number = 1) => {
      const current = itemsRef.current.find((item) => item.productId === productId);
      const nextQuantity = Math.min((current?.quantity ?? 0) + quantity, MAX_ITEM_QUANTITY);
      return mutate(
        withQuantity(itemsRef.current, productId, nextQuantity),
        () => addToCartAction(productId, quantity),
        { action: 'add', productId, quantity },
      );
    },
    [mutate],
  );

  const updateCartItem = useCallback(
    (productId: string, quantity: number) =>
      mutate(
        withQuantity(itemsRef.current, productId, quantity),
        () => updateCartItemAction(productId, quantity),
        { action: 'update', productId, quantity },
      ),
    [mutate],
  );

  const removeFromCart = useCallback(
    (productId: string) =>
      mutate(withQuantity(itemsRef.current, productId, 0), () => removeFromCartAction(productId), {
        action: 'remove',
        productId,
      }),
    [mutate],
  );

  const clearCart = useCallback(async () => {
    // Behind any change still on its way, or that change would bring lines back.
    await queueRef.current;
    const result = await clearCartAction();
    if (result.success) {
      setCart(null);
      setOptimisticItems(null);
    } else {
      logger.error({ error: result.error }, 'Failed to clear cart');
    }
    return result;
  }, []);

  // Stable, so a page can run it from an effect once its order is confirmed.
  const clearCartAfterPayment = useCallback(async (reference: string) => {
    const result = await clearCartAfterPaymentAction(reference);
    if (result.success && result.data.cleared) {
      setCart(null);
      setOptimisticItems(null);
    } else if (!result.success) {
      logger.error({ error: result.error, reference }, 'Failed to clear cart after payment');
    }
    return result;
  }, []);

  // Check the cart again, for a page that must not show lines that cannot be bought
  // (checkout): a product can be unpublished while it sits in a cart.
  const revalidateCart = useCallback(async () => {
    await queueRef.current;
    try {
      const result = await getValidatedCartAction();
      if (!result.success) {
        logger.error({ error: result.error }, 'Failed to revalidate cart');
        return;
      }
      setCart(result.data.cart);
      if (result.data.removedProductIds.length > 0) {
        setRemovedProductIds(result.data.removedProductIds);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to revalidate cart');
    }
  }, []);

  const dismissRemovedProducts = useCallback(() => setRemovedProductIds([]), []);

  const itemCount = items.reduce((total: number, item) => total + item.quantity, 0);

  return {
    cart,
    items,
    itemCount,
    loading,
    pending,
    removedProductIds,
    dismissRemovedProducts,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    clearCartAfterPayment,
    refreshCart: reloadCart,
    revalidateCart,
  };
}
