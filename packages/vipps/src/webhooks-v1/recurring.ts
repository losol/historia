import {
  RECURRING_AGREEMENT_EVENTS,
  RECURRING_CHARGE_EVENTS,
  type RecurringWebhookPayload,
} from './types';

/**
 * Validates the documented Recurring envelope without requiring ePayment-only fields.
 * Only eventType must be a known value; other fields are type-checked so new Vipps values still parse.
 */
export function isValidRecurringWebhookPayload(
  payload: unknown,
): payload is RecurringWebhookPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const p = payload as Record<string, unknown>;
  if (
    typeof p.agreementId !== 'string' ||
    typeof p.occurred !== 'string' ||
    typeof p.eventType !== 'string' ||
    (p.msn !== undefined && typeof p.msn !== 'string')
  ) {
    return false;
  }

  if (RECURRING_AGREEMENT_EVENTS.some((event) => event === p.eventType)) {
    return (
      (p.agreementUUID === undefined || typeof p.agreementUUID === 'string') &&
      [p.agreementExternalId, p.actor].every((value) => value == null || typeof value === 'string')
    );
  }

  return (
    RECURRING_CHARGE_EVENTS.some((event) => event === p.eventType) &&
    typeof p.chargeId === 'string' &&
    typeof p.amount === 'number' &&
    Number.isFinite(p.amount) &&
    typeof p.currency === 'string' &&
    typeof p.chargeType === 'string' &&
    [p.chargeExternalId, p.transactionId, p.failureText, p.failureReason].every(
      (value) => value == null || typeof value === 'string',
    ) &&
    [p.amountCaptured, p.amountCanceled, p.amountRefunded].every(
      (value) => value === undefined || (typeof value === 'number' && Number.isFinite(value)),
    ) &&
    (p.failureCode == null || (typeof p.failureCode === 'number' && Number.isFinite(p.failureCode)))
  );
}

/** Verify the raw body with verifyWebhookSignature before parsing. Existing ePayment parsing is unchanged. */
export function parseRecurringWebhookPayload(body: unknown): RecurringWebhookPayload {
  let payload = body;
  if (typeof body === 'string') {
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error('Invalid JSON in recurring webhook payload');
    }
  }
  if (!isValidRecurringWebhookPayload(payload)) {
    throw new Error('Invalid recurring webhook payload structure');
  }
  return payload;
}
