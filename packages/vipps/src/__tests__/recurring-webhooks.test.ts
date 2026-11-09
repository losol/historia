import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  getEventType,
  isValidRecurringWebhookPayload,
  parseRecurringWebhookPayload,
  parseWebhookPayload,
  RECURRING_AGREEMENT_EVENTS,
  RECURRING_CHARGE_EVENTS,
  type RecurringAgreementWebhookPayload,
  type RecurringChargeWebhookPayload,
  type RegisterWebhookRequest,
  verifyWebhookSignature,
  type WebhookRequest,
} from '../webhooks-v1';

const agreement: RecurringAgreementWebhookPayload = {
  agreementId: 'agr_test',
  agreementUUID: 'c81bf516-7972-488e-bbf1-146dcd8592f9',
  agreementExternalId: null,
  eventType: 'recurring.agreement-stopped.v1',
  occurred: '2026-11-07T10:00:00Z',
  actor: 'MERCHANT',
};
const charge: RecurringChargeWebhookPayload = {
  agreementId: 'agr_test',
  chargeId: 'chg_test',
  chargeExternalId: null,
  transactionId: null,
  eventType: 'recurring.charge-canceled.v1',
  occurred: '2026-11-07T10:00:00Z',
  msn: '123456',
  amount: 900,
  currency: 'NOK',
  chargeType: 'RECURRING',
  amountCaptured: 0,
  amountCanceled: 900,
  amountRefunded: 0,
  failureCode: null,
  failureReason: null,
};

function sign(body: string): WebhookRequest {
  const contentHash = createHash('sha256').update(body).digest('base64');
  const date = 'Sat, 07 Nov 2026 10:00:00 GMT';
  const host = 'example.com';
  const pathAndQuery = '/webhooks/vipps?source=recurring';
  const signature = createHmac('sha256', 'webhook-secret')
    .update(`POST\n${pathAndQuery}\n${date};${host};${contentHash}`)
    .digest('base64');
  return {
    method: 'POST',
    pathAndQuery,
    body,
    headers: {
      'x-ms-date': date,
      host,
      'x-ms-content-sha256': contentHash,
      authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
    },
  };
}

describe('Recurring webhooks', () => {
  it('allows all documented recurring event types in webhook registrations', () => {
    const registration: RegisterWebhookRequest = {
      url: 'https://example.com/webhooks',
      events: [...RECURRING_AGREEMENT_EVENTS, ...RECURRING_CHARGE_EVENTS],
    };
    expect(registration.events).toHaveLength(10);
    expect(registration.events).toContain('recurring.charge-refunded.v1');
  });

  it.each(RECURRING_AGREEMENT_EVENTS)('parses %s', (eventType) => {
    const payload = { ...agreement, eventType, actor: null };
    expect(parseRecurringWebhookPayload(JSON.stringify(payload))).toEqual(payload);
    expect(isValidRecurringWebhookPayload(payload)).toBe(true);
  });

  it.each(RECURRING_CHARGE_EVENTS)('parses %s', (eventType) => {
    const payload = { ...charge, eventType };
    expect(parseRecurringWebhookPayload(payload)).toEqual(payload);
  });

  it('retains asynchronous creation failure details', () => {
    const payload: RecurringChargeWebhookPayload = {
      ...charge,
      eventType: 'recurring.charge-creation-failed.v1',
      failureCode: 50003,
      failureText: 'Charge is requested for non-active agreement',
      failureReason: 'user_action_required',
    };
    expect(parseRecurringWebhookPayload(payload)).toEqual(payload);
  });

  it.each([agreement, charge])(
    'verifies recurring raw bodies without changing the HMAC implementation',
    (payload) => {
      const request = sign(JSON.stringify(payload));
      expect(verifyWebhookSignature(request, 'webhook-secret')).toBe(true);
      expect(verifyWebhookSignature(request, 'wrong-secret')).toBe(false);
      expect(
        verifyWebhookSignature({ ...request, body: `${request.body} ` }, 'webhook-secret'),
      ).toBe(false);
      expect(parseRecurringWebhookPayload(request.body)).toEqual(payload);
    },
  );

  it('parses agreement-stopped with actor SYSTEM', () => {
    const payload = { ...agreement, actor: 'SYSTEM' };
    expect(parseRecurringWebhookPayload(JSON.stringify(payload))).toEqual(payload);
  });

  it.each([
    { ...agreement, actor: 'OTHER' },
    { ...charge, failureReason: 'unknown' },
    { ...charge, currency: 'INVALID' },
    { ...charge, chargeType: 'NEW_TYPE' },
  ])('accepts unlisted values in informational fields: %j', (payload) => {
    expect(isValidRecurringWebhookPayload(payload)).toBe(true);
    expect(parseRecurringWebhookPayload(payload)).toEqual(payload);
  });

  it.each([
    null,
    [],
    {},
    { ...agreement, eventType: 'recurring.unknown.v1' },
    { ...agreement, occurred: undefined },
    { ...agreement, actor: ['USER'] },
    { ...charge, amount: { value: 900, currency: 'NOK' } },
    { ...charge, chargeId: undefined },
    { ...charge, amountCaptured: '900' },
    { ...charge, failureReason: 42 },
    { ...charge, currency: ['NOK'] },
    { ...charge, currency: undefined },
    { ...charge, chargeType: ['RECURRING'] },
  ])('rejects malformed payloads: %j', (payload) => {
    expect(isValidRecurringWebhookPayload(payload)).toBe(false);
    expect(() => parseRecurringWebhookPayload(payload)).toThrow(
      'Invalid recurring webhook payload',
    );
  });

  it('rejects invalid JSON', () => {
    expect(() => parseRecurringWebhookPayload('{')).toThrow(
      'Invalid JSON in recurring webhook payload',
    );
  });

  it('preserves existing ePayment payload parsing and event lookup', () => {
    const payment = {
      msn: '123456',
      reference: 'payment-123',
      pspReference: 'psp-123',
      name: 'CAPTURED',
      amount: { value: 900, currency: 'NOK' },
      timestamp: '2026-11-07T10:00:00Z',
      success: true,
    };
    expect(parseWebhookPayload(JSON.stringify(payment))).toEqual(payment);
    expect(getEventType(parseWebhookPayload(payment))).toBe('epayments.payment.captured.v1');
    expect(() => parseWebhookPayload(agreement)).toThrow('Invalid webhook payload structure');
  });
});
