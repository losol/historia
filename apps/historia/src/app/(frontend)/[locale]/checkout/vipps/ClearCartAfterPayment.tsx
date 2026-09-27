'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart';

/**
 * Empties the cart once the order for `reference` exists. The confirmation page is
 * rendered on the server, where the session cookie cannot be written, so this runs
 * from the browser; it goes through the shared cart so the header's count updates too.
 */
export function ClearCartAfterPayment({ reference }: Readonly<{ reference: string }>) {
  const { clearCartAfterPayment } = useCart();

  useEffect(() => {
    void clearCartAfterPayment(reference);
  }, [clearCartAfterPayment, reference]);

  return null;
}
