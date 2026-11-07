import {
  RECURRING_AGREEMENT_EVENTS,
  RECURRING_CHARGE_EVENTS,
  type RecurringWebhookPayload,
} from './types';

function isEnumValue(value: unknown, values: readonly string[]): boolean {
  return typeof value === 'string' && values.includes(value);
}

/** Validates the documented Recurring envelope without requiring ePayment-only fields. */
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
      (p.agreementExternalId == null || typeof p.agreementExternalId === 'string') &&
      (p.actor == null || isEnumValue(p.actor, ['MERCHANT', 'USER', 'ADMIN']))
    );
  }

  return (
    RECURRING_CHARGE_EVENTS.some((event) => event === p.eventType) &&
    typeof p.chargeId === 'string' &&
    typeof p.amount === 'number' &&
    Number.isFinite(p.amount) &&
    isEnumValue(p.currency, ['NOK', 'DKK', 'EUR', 'GBP', 'USD', 'SEK']) &&
    isEnumValue(p.chargeType, ['INITIAL', 'RECURRING', 'UNSCHEDULED']) &&
    [p.chargeExternalId, p.transactionId, p.failureText].every(
      (value) => value == null || typeof value === 'string',
    ) &&
    [p.amountCaptured, p.amountCanceled, p.amountRefunded].every(
      (value) => value === undefined || (typeof value === 'number' && Number.isFinite(value)),
    ) &&
    (p.failureCode == null ||
      (typeof p.failureCode === 'number' && Number.isFinite(p.failureCode))) &&
    (p.failureReason == null ||
      isEnumValue(p.failureReason, [
        'user_action_required',
        'charge_amount_too_high',
        'non_technical_error',
        'technical_error',
      ]))
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
