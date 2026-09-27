/**
 * Cart module - Session-based cart using encrypted JWT
 *
 * This replaces the old localStorage-based cart with secure server-side storage.
 * Components use `useCart()`, which shares one cart across the page; the hook
 * behind it is only used by `CartProvider`.
 */

export { CartProvider, useCart } from './CartProvider';
export type { Cart, CartItem, SessionData } from './types';
