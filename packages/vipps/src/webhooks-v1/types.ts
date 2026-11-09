/**
 * Vipps MobilePay ePayment and Recurring Webhooks
 *
 * Types and utilities for handling Vipps ePayment webhook events.
 * https://developer.vippsmobilepay.com/docs/APIs/epayment-api/api-guide/webhooks/
 */

import type { ChargeFailureReason, ChargeType, RecurringCurrency } from '../recurring-v3/types';
import type { PaymentAmount } from '../vipps-core';

export const RECURRING_AGREEMENT_EVENTS = [
  'recurring.agreement-activated.v1',
  'recurring.agreement-rejected.v1',
  'recurring.agreement-stopped.v1',
  'recurring.agreement-expired.v1',
] as const;

export const RECURRING_CHARGE_EVENTS = [
  'recurring.charge-reserved.v1',
  'recurring.charge-captured.v1',
  'recurring.charge-canceled.v1',
  'recurring.charge-refunded.v1',
  'recurring.charge-failed.v1',
  'recurring.charge-creation-failed.v1',
] as const;

export type RecurringAgreementEventType = (typeof RECURRING_AGREEMENT_EVENTS)[number];
export type RecurringChargeEventType = (typeof RECURRING_CHARGE_EVENTS)[number];
export type RecurringWebhookEventType = RecurringAgreementEventType | RecurringChargeEventType;

/** Known values for autocomplete; Vipps may add others, which parse as plain strings. */
type OpenString<T extends string> = T | (string & {});

/**
 * ePayment and Recurring webhook event types
 */
export type WebhookEventType =
  | 'epayments.payment.created.v1'
  | 'epayments.payment.aborted.v1'
  | 'epayments.payment.expired.v1'
  | 'epayments.payment.cancelled.v1'
  | 'epayments.payment.captured.v1'
  | 'epayments.payment.refunded.v1'
  | 'epayments.payment.authorized.v1'
  | 'epayments.payment.terminated.v1'
  | RecurringWebhookEventType;

interface RecurringWebhookBase {
  agreementId: string;
  /** ISO 8601 UTC timestamp (not the ePayment timestamp field). */
  occurred: string;
  /** Present in current deliveries; older examples omit it. */
  msn?: string;
}

export interface RecurringAgreementWebhookPayload extends RecurringWebhookBase {
  eventType: RecurringAgreementEventType;
  agreementUUID?: string;
  agreementExternalId?: string | null;
  /** Applicable to agreement-stopped only. */
  actor?: OpenString<'MERCHANT' | 'USER' | 'ADMIN' | 'SYSTEM'> | null;
}

export interface RecurringChargeWebhookPayload extends RecurringWebhookBase {
  eventType: RecurringChargeEventType;
  chargeId: string;
  chargeExternalId?: string | null;
  transactionId?: string | null;
  /** Integer minor units, unlike the ePayment amount object. */
  amount: number;
  chargeType: OpenString<ChargeType>;
  currency: OpenString<RecurringCurrency>;
  amountCaptured?: number;
  amountCanceled?: number;
  amountRefunded?: number;
  failureCode?: number | null;
  /** @deprecated Use failureReason. */
  failureText?: string | null;
  failureReason?: OpenString<ChargeFailureReason> | null;
}

export type RecurringWebhookPayload =
  | RecurringAgreementWebhookPayload
  | RecurringChargeWebhookPayload;

/**
 * Payment event name (same as in PaymentEvent from epayment-v1)
 */
export type PaymentEventName =
  | 'CREATED'
  | 'ABORTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CAPTURED'
  | 'REFUNDED'
  | 'AUTHORIZED'
  | 'TERMINATED';

/**
 * Shipping details from webhook
 */
export interface WebhookShippingDetails {
  address: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    country?: string;
    postCode?: string;
  };
  shippingCost: number;
  shippingOptionId: string;
  shippingOptionName?: string;
}

/**
 * User details from webhook (Express Checkout)
 */
export interface WebhookUserDetails {
  email?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  addresses?: Array<{
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    country?: string;
    postCode?: string;
  }>;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  /** Merchant Serial Number */
  msn: string;
  /** Payment reference */
  reference: string;
  /** PSP reference for this specific event */
  pspReference: string;
  /** Event name */
  name: PaymentEventName;
  /** Amount for this event */
  amount: PaymentAmount;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Idempotency key (optional) */
  idempotencyKey?: string | null;
  /** Whether the operation was successful */
  success: boolean;
  /** Shipping details (Express Checkout) */
  shippingDetails?: WebhookShippingDetails;
  /** User details (Express Checkout) */
  userDetails?: WebhookUserDetails;
  /** Subject identifier for profile data (if profile.scope was requested) */
  sub?: string;
}

/**
 * Webhook registration request
 */
export interface RegisterWebhookRequest {
  /** Webhook callback URL */
  url: string;
  /** Events to subscribe to */
  events: WebhookEventType[];
}

/**
 * Webhook registration response
 */
export interface RegisterWebhookResponse {
  /** Unique webhook ID */
  id: string;
  /** Webhook secret for signature verification */
  secret: string;
}

/**
 * List webhooks response
 */
export interface ListWebhooksResponse {
  webhooks: Array<{
    id: string;
    url: string;
    events: WebhookEventType[];
    createdAt: string;
  }>;
}
