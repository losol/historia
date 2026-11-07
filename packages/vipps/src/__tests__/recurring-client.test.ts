import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Agreement,
  Charge,
  CreateAgreementRequest,
  CreateChargeRequest,
} from '../recurring-v3';
import {
  cancelCharge,
  captureCharge,
  createAgreement,
  createCharge,
  forceAcceptAgreement,
  getAgreement,
  getCharge,
  listAgreements,
  listCharges,
  refundCharge,
  updateAgreement,
} from '../recurring-v3';
import { buildHeaders, type VippsConfig } from '../vipps-core';

const logs = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));
vi.mock('@eventuras/logger', () => ({ Logger: { create: () => logs } }));

const config: VippsConfig = {
  apiUrl: 'https://apitest.vipps.no',
  merchantSerialNumber: '123456',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  subscriptionKey: 'subscription-key',
  systemName: 'test-system',
  systemVersion: '1.0.0',
  pluginName: 'test-plugin',
  pluginVersion: '1.0.0',
};

const agreementRequest: CreateAgreementRequest = {
  pricing: { type: 'LEGACY', amount: 900, currency: 'NOK' },
  interval: { unit: 'MONTH', count: 1 },
  productName: 'Membership',
  productDescription: 'One person',
  merchantRedirectUrl: 'https://example.com/return',
  merchantAgreementUrl: 'https://example.com/membership',
  phoneNumber: '4798765432',
  initialCharge: { amount: 900, description: 'First month', transactionType: 'DIRECT_CAPTURE' },
  scope: 'name birthDate',
  externalId: 'membership-1',
};

const agreement: Agreement = {
  id: 'agr_test',
  uuid: 'acbff22f-0438-4fa2-bc50-fae782bcf098',
  status: 'ACTIVE',
  pricing: agreementRequest.pricing,
  interval: { unit: 'MONTH', count: 1, text: 'every month' },
  productName: 'Membership',
  merchantRedirectUrl: agreementRequest.merchantRedirectUrl,
  merchantAgreementUrl: 'https://example.com/membership',
  created: '2026-11-07T10:00:00Z',
  start: '2026-11-07T10:01:00Z',
  stop: null,
  sub: 'profile-subject',
  userinfoUrl: 'https://apitest.vipps.no/vipps-userinfo-api/userinfo/profile-subject',
  countryCode: 'NO',
  paymentMethod: { blockedSources: [] },
  history: [{ event: 'ACTIVATE', actor: 'USER', occurred: '2026-11-07T10:01:00Z' }],
};

const chargeRequest: CreateChargeRequest = {
  amount: 900,
  description: 'December membership',
  due: '2026-12-01',
  retryDays: 2,
  transactionType: 'RESERVE_CAPTURE',
  type: 'RECURRING',
  orderId: 'membership-1-2026-12',
  externalId: 'monthly-charge',
};

const charge: Charge = {
  id: 'chg_test',
  agreementId: agreement.id,
  transactionId: null,
  amount: 900,
  currency: 'NOK',
  description: chargeRequest.description,
  due: '2026-12-01T00:00:00Z',
  retryDays: 2,
  processingMode: 'MULTIPLE_ATTEMPTS',
  type: 'RECURRING',
  transactionType: 'RESERVE_CAPTURE',
  status: 'PENDING',
  externalId: 'monthly-charge',
  summary: { captured: 0, refunded: 0, cancelled: 0 },
  history: [],
};

const created = {
  agreementId: agreement.id,
  uuid: agreement.uuid,
  vippsConfirmationUrl: 'https://apitest.vipps.no/confirmation',
  chargeId: 'chg_initial',
};
const fetchMock = vi.fn<typeof fetch>();

function mockResponses(body: unknown, status = 200, headers?: HeadersInit) {
  fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'test-token' }));
  fetchMock.mockResolvedValueOnce(
    body === undefined
      ? new Response(null, { status, headers })
      : Response.json(body, { status, headers }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

interface OperationCase {
  name: string;
  call: () => Promise<unknown>;
  path: string;
  method: string;
  body?: unknown;
  response?: unknown;
  status?: number;
}

const cases: OperationCase[] = [
  {
    name: 'createAgreement',
    call: () => createAgreement(config, agreementRequest, 'key-1'),
    path: '/recurring/v3/agreements',
    method: 'POST',
    body: agreementRequest,
    response: created,
    status: 201,
  },
  {
    name: 'getAgreement',
    call: () => getAgreement(config, 'agr_test'),
    path: '/recurring/v3/agreements/agr_test',
    method: 'GET',
    response: agreement,
  },
  {
    name: 'listAgreements',
    call: () =>
      listAgreements(config, { status: 'STOPPED', createdAfter: 0, pageNumber: 2, pageSize: 100 }),
    path: '/recurring/v3/agreements?status=STOPPED&createdAfter=0&pageNumber=2&pageSize=100',
    method: 'GET',
    response: [{ ...agreement, status: 'STOPPED' }],
  },
  {
    name: 'updateAgreement',
    call: () =>
      updateAgreement(
        config,
        'agr_test',
        { status: 'STOPPED', pricing: { amount: 1900 } },
        'key-1',
      ),
    path: '/recurring/v3/agreements/agr_test',
    method: 'PATCH',
    body: { status: 'STOPPED', pricing: { amount: 1900 } },
    status: 204,
  },
  {
    name: 'createCharge',
    call: () => createCharge(config, 'agr_test', chargeRequest, 'key-1'),
    path: '/recurring/v3/agreements/agr_test/charges',
    method: 'POST',
    body: chargeRequest,
    response: { chargeId: charge.id },
    status: 201,
  },
  {
    name: 'getCharge',
    call: () => getCharge(config, 'agr_test', 'chg_test'),
    path: '/recurring/v3/agreements/agr_test/charges/chg_test',
    method: 'GET',
    response: charge,
  },
  {
    name: 'listCharges',
    call: () => listCharges(config, 'agr_test', { status: 'RESERVED' }),
    path: '/recurring/v3/agreements/agr_test/charges?status=RESERVED',
    method: 'GET',
    response: [{ ...charge, status: 'RESERVED' }],
  },
  {
    name: 'cancelCharge',
    call: () => cancelCharge(config, 'agr_test', 'chg_test', 'key-1'),
    path: '/recurring/v3/agreements/agr_test/charges/chg_test',
    method: 'DELETE',
    status: 204,
  },
  {
    name: 'captureCharge',
    call: () => captureCharge(config, 'agr_test', 'chg_test', { amount: 450 }, 'key-1'),
    path: '/recurring/v3/agreements/agr_test/charges/chg_test/capture',
    method: 'POST',
    body: { amount: 450 },
    status: 204,
  },
  {
    name: 'refundCharge',
    call: () =>
      refundCharge(
        config,
        'agr_test',
        'chg_test',
        { amount: 450, description: 'Partial refund' },
        'key-1',
      ),
    path: '/recurring/v3/agreements/agr_test/charges/chg_test/refund',
    method: 'POST',
    body: { amount: 450, description: 'Partial refund' },
    status: 204,
  },
  {
    name: 'forceAcceptAgreement',
    call: () => forceAcceptAgreement(config, 'agr_test', { phoneNumber: '4798765432' }, 'key-1'),
    path: '/recurring/v3/agreements/agr_test/accept',
    method: 'PATCH',
    body: { phoneNumber: '4798765432' },
    status: 204,
  },
];

describe.each(cases)('$name', (operation) => {
  it('sends the documented method, path, headers and body and parses the response', async () => {
    mockResponses(operation.response, operation.status);
    expect(await operation.call()).toEqual(operation.response);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${config.apiUrl}/accesstoken/get`, {
      method: 'POST',
      headers: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Merchant-Serial-Number': config.merchantSerialNumber,
      },
    });
    // Spell out the headers so a regression in buildHeaders is caught too.
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${config.apiUrl}${operation.path}`, {
      method: operation.method,
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': 'subscription-key',
        'Merchant-Serial-Number': '123456',
        'Vipps-System-Name': 'test-system',
        'Vipps-System-Version': '1.0.0',
        'Vipps-System-Plugin-Name': 'test-plugin',
        'Vipps-System-Plugin-Version': '1.0.0',
        ...(operation.method === 'GET' ? {} : { 'Idempotency-Key': 'key-1' }),
      },
      ...(operation.body === undefined ? {} : { body: JSON.stringify(operation.body) }),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('includes the HTTP status and error body in the error returned to the caller', async () => {
    mockResponses({ title: 'Not found' }, 404);
    await expect(operation.call()).rejects.toThrow('404 - {"title":"Not found"}');
  });
});

describe('Recurring transport behavior', () => {
  it('returns a legacy campaign with the documented discriminator and expiry', async () => {
    const fixture = {
      ...agreement,
      campaign: { type: 'LEGACY_CAMPAIGN', price: 100, end: '2026-12-01T00:00:00Z' },
    } satisfies Agreement;
    mockResponses(fixture);
    const result = await getAgreement(config, agreement.id);
    expect(result).toEqual(fixture);
    if (result.campaign?.type !== 'LEGACY_CAMPAIGN') throw new Error('Expected legacy campaign');
    const end: string = result.campaign.end;
    expect(end).toBe('2026-12-01T00:00:00Z');
  });

  it('returns the computed end date and period in listed period campaigns', async () => {
    const fixture = {
      ...agreement,
      campaign: {
        type: 'PERIOD_CAMPAIGN',
        price: 100,
        end: '2026-12-01T00:00:00Z',
        period: { unit: 'MONTH', count: 1 },
      },
    } satisfies Agreement;
    mockResponses([fixture]);
    const results = await listAgreements(config);
    expect(results).toEqual([fixture]);
    const campaign = results[0]?.campaign;
    if (campaign?.type !== 'PERIOD_CAMPAIGN') throw new Error('Expected period campaign');
    const end: string = campaign.end;
    expect(end).toBe('2026-12-01T00:00:00Z');
    expect(campaign.period).toEqual({ unit: 'MONTH', count: 1 });
  });

  it('uses the same key and body when createCharge is retried', async () => {
    mockResponses({ chargeId: charge.id }, 201);
    mockResponses({ chargeId: charge.id }, 201);
    const first = await createCharge(config, agreement.id, chargeRequest, 'stable-charge-key');
    expect(await createCharge(config, agreement.id, chargeRequest, 'stable-charge-key')).toEqual(
      first,
    );
    expect(fetchMock.mock.calls[1]).toEqual(fetchMock.mock.calls[3]);
  });

  it('follows continuation headers, retaining the charge status filter', async () => {
    mockResponses([charge], 200, { 'Continuation-Token': 'next-page' });
    mockResponses([{ ...charge, id: 'chg_next' }]);
    expect(await listCharges(config, agreement.id, { status: 'PENDING' })).toEqual([
      charge,
      { ...charge, id: 'chg_next' },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      `${config.apiUrl}/recurring/v3/agreements/agr_test/charges?status=PENDING`,
      {
        method: 'GET',
        headers: { ...buildHeaders(config, 'test-token'), 'Continuation-Token': 'next-page' },
      },
    );
  });

  it('omits the query string for default lists and accepts empty arrays', async () => {
    mockResponses([]);
    expect(await listAgreements(config)).toEqual([]);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${config.apiUrl}/recurring/v3/agreements`);
    mockResponses([]);
    expect(await listCharges(config, agreement.id)).toEqual([]);
    expect(fetchMock.mock.calls[3]?.[0]).toBe(
      `${config.apiUrl}/recurring/v3/agreements/agr_test/charges`,
    );
  });

  it('encodes agreement and charge IDs as individual path segments', async () => {
    mockResponses(charge);
    await getCharge(config, 'agr/a?b', 'chg/c#d');
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      `${config.apiUrl}/recurring/v3/agreements/agr%2Fa%3Fb/charges/chg%2Fc%23d`,
    );
  });

  it('accepts a bodyless 202 cancellation response', async () => {
    mockResponses(undefined, 202);
    await expect(
      cancelCharge(config, agreement.id, charge.id, 'cancel-key'),
    ).resolves.toBeUndefined();
  });

  it('preserves nullable initial-charge and profile fields', async () => {
    mockResponses({ ...created, chargeId: null });
    expect((await createAgreement(config, agreementRequest, 'create-key')).chargeId).toBeNull();
    mockResponses({ ...agreement, sub: null, userinfoUrl: null, start: null });
    expect((await getAgreement(config, agreement.id)).sub).toBeNull();
  });

  it('does not call the resource endpoint after authentication fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Invalid credentials', { status: 401 }));
    await expect(getAgreement(config, agreement.id)).rejects.toThrow(
      'Vipps authentication failed: 401',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates network and JSON parsing failures', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network unavailable'));
    await expect(getAgreement(config, agreement.id)).rejects.toThrow('Network unavailable');
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'test-token' }));
    fetchMock.mockResolvedValueOnce(new Response('not JSON'));
    await expect(getAgreement(config, agreement.id)).rejects.toThrow();
  });

  it('keeps phone numbers, profiles, secrets and echoed error bodies out of logs', async () => {
    mockResponses(created, 201);
    await createAgreement(config, agreementRequest, 'create-key');
    mockResponses({ phoneNumber: '4798765432', sub: 'profile-subject', name: 'Ada Example' }, 400);
    await expect(
      forceAcceptAgreement(config, agreement.id, { phoneNumber: '4798765432' }, 'accept-key'),
    ).rejects.toThrow('400');
    const logged = JSON.stringify([logs.info.mock.calls, logs.error.mock.calls]);
    for (const personal of [
      '4798765432',
      'profile-subject',
      'Ada Example',
      'client-secret',
      'subscription-key',
    ]) {
      expect(logged).not.toContain(personal);
    }
  });

  it.each([
    'https://api.vipps.no',
    'http://apitest.vipps.no',
    'https://apitest.vipps.no.evil.example',
  ])('rejects force acceptance outside apitest: %s', async (apiUrl) => {
    await expect(
      forceAcceptAgreement(
        { ...config, apiUrl },
        agreement.id,
        { phoneNumber: '4798765432' },
        'key',
      ),
    ).rejects.toThrow('only available');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const mutations = [
    (key: string) => createAgreement(config, agreementRequest, key),
    (key: string) => updateAgreement(config, agreement.id, { status: 'STOPPED' }, key),
    (key: string) => createCharge(config, agreement.id, chargeRequest, key),
    (key: string) => cancelCharge(config, agreement.id, charge.id, key),
    (key: string) => captureCharge(config, agreement.id, charge.id, { amount: 900 }, key),
    (key: string) =>
      refundCharge(config, agreement.id, charge.id, { amount: 900, description: 'Refund' }, key),
    (key: string) => forceAcceptAgreement(config, agreement.id, { phoneNumber: '4798765432' }, key),
  ];
  it.each(['', 'a'.repeat(41), 'bad/key', 'bad?key', 'bad#key', 'bad\\key'])(
    'rejects invalid mutation keys before making any requests: %s',
    async (key) => {
      for (const mutate of mutations) {
        await expect(mutate(key)).rejects.toThrow('Idempotency-Key');
      }
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
