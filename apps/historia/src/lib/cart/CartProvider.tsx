'use client';

import type React from 'react';
import { createContext, useContext } from 'react';
import { useSessionCart } from './use-session-cart';

// The provider hands out exactly what useSessionCart returns, so derive the type from it
// instead of restating it by hand.
type CartContextValue = ReturnType<typeof useSessionCart>;

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const cart = useSessionCart();

  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
