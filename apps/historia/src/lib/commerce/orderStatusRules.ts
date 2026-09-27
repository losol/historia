/**
 * Business rules for order status transitions and permissions.
 *
 * This module defines the core business logic for order management,
 * independent of Payload CMS access control.
 */

/**
 * Order statuses in the system
 */
export type OrderStatus = 'pending' | 'processing' | 'on-hold' | 'completed' | 'canceled';

/**
 * Statuses that allow editing by commerce managers and admins
 */
export const EDITABLE_ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'processing'] as const;

/**
 * Statuses that are considered "locked" and require system admin to edit
 */
export const LOCKED_ORDER_STATUSES: readonly OrderStatus[] = [
  'on-hold',
  'completed',
  'canceled',
] as const;

/**
 * Check if an order status allows editing by commerce managers/admins.
 *
 * Business rule: Only orders in 'pending' or 'processing' status can be
 * edited by regular commerce staff. Other statuses require system admin.
 *
 * @param status - The current order status
 * @returns true if the order can be edited by commerce/admin roles
 *
 * @example
 * ```ts
 * isOrderEditableByCommerce('pending')    // true
 * isOrderEditableByCommerce('processing') // true
 * isOrderEditableByCommerce('completed')  // false
 * isOrderEditableByCommerce('canceled')   // false
 * ```
 */
export function isOrderEditableByCommerce(status: string | undefined): boolean {
  if (!status) return false;
  return EDITABLE_ORDER_STATUSES.includes(status as OrderStatus);
}

/**
 * Check if an order status is locked and requires system admin to edit.
 *
 * @param status - The current order status
 * @returns true if the order is locked
 */
export function isOrderLocked(status: string | undefined): boolean {
  if (!status) return false;
  return LOCKED_ORDER_STATUSES.includes(status as OrderStatus);
}

/**
 * Get a human-readable reason why an order cannot be edited.
 *
 * @param status - The current order status
 * @returns Explanation string or null if order is editable
 */
export function getOrderLockReason(status: string | undefined): string | null {
  if (!status) return 'Order status is missing';

  if (isOrderLocked(status)) {
    return `Orders with status '${status}' can only be edited by system administrators`;
  }

  return null;
}

// ============================================================================
// Status transitions from payment events
// ============================================================================

/**
 * Transaction statuses, as written by the Vipps webhook, the return page and the
 * admin actions (capture, refund, cancel).
 */
export type TransactionStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'completed'
  | 'partially-refunded'
  | 'refunded'
  | 'failed'
  | 'cancelled';

/**
 * Where a transaction may go from each status. Payment events can arrive late,
 * twice or out of order (a retried CREATED after AUTHORIZED, an AUTHORIZED after
 * the capture), and the webhook and the return page write the same transaction:
 * anything not listed here would move a payment backwards.
 */
const TRANSACTION_TRANSITIONS: Record<TransactionStatus, readonly TransactionStatus[]> = {
  pending: ['authorized', 'captured', 'failed', 'cancelled'],
  // An authorization can be cancelled or expire (failed) before capture.
  authorized: ['captured', 'failed', 'cancelled'],
  captured: ['completed', 'partially-refunded', 'refunded'],
  completed: ['partially-refunded', 'refunded'],
  'partially-refunded': ['refunded'],
  refunded: [],
  failed: [],
  cancelled: [],
};

/**
 * Whether a transaction may move from `from` to `to`. Same status is not a
 * transition. A status this list does not know (older data; the field is free
 * text) may move anywhere, as before.
 */
export function canTransitionTransaction(from: string | null | undefined, to: string): boolean {
  if (!from) return true;
  if (from === to) return false;
  const allowed = TRANSACTION_TRANSITIONS[from as TransactionStatus];
  return allowed ? allowed.includes(to as TransactionStatus) : true;
}

/**
 * Where a payment event may move an order. `on-hold` and `canceled` are left alone:
 * they are set by a person, or by the amount check when an order does not match its
 * payment, and a payment event must not release them. `completed` only goes to
 * `canceled`, for a full refund.
 */
const ORDER_TRANSITIONS_FROM_PAYMENT: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['processing', 'completed', 'canceled'],
  processing: ['completed', 'canceled'],
  completed: ['canceled'],
  'on-hold': [],
  canceled: [],
};

export function canTransitionOrderFromPayment(
  from: string | null | undefined,
  to: OrderStatus,
): boolean {
  if (!from) return true;
  if (from === to) return false;
  const allowed = ORDER_TRANSITIONS_FROM_PAYMENT[from as OrderStatus];
  return allowed ? allowed.includes(to) : false;
}
