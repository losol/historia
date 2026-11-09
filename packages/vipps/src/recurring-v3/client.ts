/** https://developer.vippsmobilepay.com/api/recurring/ */
import { Logger } from '@eventuras/logger';
import { buildHeaders, getAccessToken, type VippsConfig } from '../vipps-core';
import type {
  Agreement,
  CaptureChargeRequest,
  Charge,
  CreateAgreementRequest,
  CreateAgreementResponse,
  CreateChargeRequest,
  CreateChargeResponse,
  ForceAcceptAgreementRequest,
  ListAgreementsOptions,
  ListChargesOptions,
  RefundChargeRequest,
  UpdateAgreementRequest,
} from './types';

const logger = Logger.create({
  namespace: 'eventuras:vipps',
  context: { module: 'recurringClient' },
});

const agreementsPath = '/recurring/v3/agreements';
const agreementPath = (id: string) => `${agreementsPath}/${encodeURIComponent(id)}`;
const chargesPath = (id: string) => `${agreementPath(id)}/charges`;
const chargePath = (agreementId: string, chargeId: string) =>
  `${chargesPath(agreementId)}/${encodeURIComponent(chargeId)}`;

function queryString(options: ListAgreementsOptions | ListChargesOptions): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  continuationToken?: string;
}

async function request(
  config: VippsConfig,
  path: string,
  operation: string,
  options: RequestOptions,
): Promise<Response> {
  // Recurring v3 requires a key on every mutation, including DELETE.
  if (
    options.method !== 'GET' &&
    (!options.idempotencyKey ||
      options.idempotencyKey.length > 40 ||
      /[#?/\\]/.test(options.idempotencyKey))
  ) {
    throw new Error('Recurring Idempotency-Key must be 1–40 characters without #, ?, / or \\');
  }

  const startTime = Date.now();
  let status: number | undefined;
  try {
    logger.info({ operation }, 'Calling Vipps Recurring API');
    const accessToken = await getAccessToken(config);
    const headers = buildHeaders(config, accessToken, options.idempotencyKey);
    if (options.continuationToken) headers['Continuation-Token'] = options.continuationToken;

    const response = await fetch(`${config.apiUrl}${path}`, {
      method: options.method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    status = response.status;
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to ${operation}: ${response.status} - ${errorText}`);
    }

    logger.info(
      { operation, status, responseTimeMs: Date.now() - startTime },
      'Successfully called Vipps Recurring API',
    );
    return response;
  } catch (error) {
    // Do not log bodies, URLs, phone numbers, profiles or upstream errors that
    // may echo personal data. Return the original error to the caller.
    logger.error(
      { operation, status, responseTimeMs: Date.now() - startTime },
      'Vipps Recurring API request failed',
    );
    throw error;
  }
}

/** POST /recurring/v3/agreements. Reuse the same key and body when retrying. */
export async function createAgreement(
  config: VippsConfig,
  body: CreateAgreementRequest,
  idempotencyKey: string,
): Promise<CreateAgreementResponse> {
  const response = await request(config, agreementsPath, 'create agreement', {
    method: 'POST',
    body,
    idempotencyKey,
  });
  return response.json() as Promise<CreateAgreementResponse>;
}

/** GET /recurring/v3/agreements/{agreementId}. Check ACTIVE before provisioning. */
export async function getAgreement(config: VippsConfig, agreementId: string): Promise<Agreement> {
  const response = await request(config, agreementPath(agreementId), 'get agreement', {
    method: 'GET',
  });
  return response.json() as Promise<Agreement>;
}

/** GET /recurring/v3/agreements. Returns one page; defaults to ACTIVE at Vipps. */
export async function listAgreements(
  config: VippsConfig,
  options: ListAgreementsOptions = {},
): Promise<Agreement[]> {
  const response = await request(
    config,
    `${agreementsPath}${queryString(options)}`,
    'list agreements',
    { method: 'GET' },
  );
  return response.json() as Promise<Agreement[]>;
}

/** PATCH /recurring/v3/agreements/{agreementId}. Returns no content. */
export async function updateAgreement(
  config: VippsConfig,
  agreementId: string,
  body: UpdateAgreementRequest,
  idempotencyKey: string,
): Promise<void> {
  await request(config, agreementPath(agreementId), 'update agreement', {
    method: 'PATCH',
    body,
    idempotencyKey,
  });
}

/** POST .../charges. Retrying with the same key and body will not create a second charge. */
export async function createCharge(
  config: VippsConfig,
  agreementId: string,
  body: CreateChargeRequest,
  idempotencyKey: string,
): Promise<CreateChargeResponse> {
  const response = await request(config, chargesPath(agreementId), 'create charge', {
    method: 'POST',
    body,
    idempotencyKey,
  });
  return response.json() as Promise<CreateChargeResponse>;
}

/** GET /recurring/v3/agreements/{agreementId}/charges/{chargeId}. */
export async function getCharge(
  config: VippsConfig,
  agreementId: string,
  chargeId: string,
): Promise<Charge> {
  const response = await request(config, chargePath(agreementId, chargeId), 'get charge', {
    method: 'GET',
  });
  return response.json() as Promise<Charge>;
}

/** GET .../charges. Follows short-lived Continuation-Token headers and returns all pages. */
export async function listCharges(
  config: VippsConfig,
  agreementId: string,
  options: ListChargesOptions = {},
): Promise<Charge[]> {
  const charges: Charge[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await request(
      config,
      `${chargesPath(agreementId)}${queryString(options)}`,
      'list charges',
      { method: 'GET', continuationToken },
    );
    charges.push(...((await response.json()) as Charge[]));
    continuationToken = response.headers.get('Continuation-Token') || undefined;
  } while (continuationToken);
  return charges;
}

/** DELETE .../charges/{chargeId}. Cancels pending, due or reserved funds (202/204). */
export async function cancelCharge(
  config: VippsConfig,
  agreementId: string,
  chargeId: string,
  idempotencyKey: string,
): Promise<void> {
  await request(config, chargePath(agreementId, chargeId), 'cancel charge', {
    method: 'DELETE',
    idempotencyKey,
  });
}

/** POST .../capture. Full or partial capture of a RESERVE_CAPTURE charge; no content. */
export async function captureCharge(
  config: VippsConfig,
  agreementId: string,
  chargeId: string,
  body: CaptureChargeRequest,
  idempotencyKey: string,
): Promise<void> {
  await request(config, `${chargePath(agreementId, chargeId)}/capture`, 'capture charge', {
    method: 'POST',
    body,
    idempotencyKey,
  });
}

/** POST .../refund. Full or partial refund; description is required; no content. */
export async function refundCharge(
  config: VippsConfig,
  agreementId: string,
  chargeId: string,
  body: RefundChargeRequest,
  idempotencyKey: string,
): Promise<void> {
  await request(config, `${chargePath(agreementId, chargeId)}/refund`, 'refund charge', {
    method: 'POST',
    body,
    idempotencyKey,
  });
}

/**
 * TEST ONLY: PATCH /recurring/v3/agreements/{agreementId}/accept.
 * The test user must have completed registration in the Vipps/MobilePay test app.
 * Rejects non-apitest URLs before fetching a token.
 */
export async function forceAcceptAgreement(
  config: VippsConfig,
  agreementId: string,
  body: ForceAcceptAgreementRequest,
  idempotencyKey: string,
): Promise<void> {
  if (new URL(config.apiUrl).origin !== 'https://apitest.vipps.no') {
    throw new Error('forceAcceptAgreement is only available at https://apitest.vipps.no');
  }
  await request(config, `${agreementPath(agreementId)}/accept`, 'force accept agreement', {
    method: 'PATCH',
    body,
    idempotencyKey,
  });
}
