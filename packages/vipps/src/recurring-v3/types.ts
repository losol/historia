/** Merchant Recurring API v3 types. All monetary amounts are integer minor units. */
export type RecurringCurrency = 'NOK' | 'DKK' | 'EUR' | 'GBP' | 'USD' | 'SEK';
export type AgreementStatus = 'PENDING' | 'ACTIVE' | 'STOPPED' | 'EXPIRED';
export type TransactionType = 'DIRECT_CAPTURE' | 'RESERVE_CAPTURE';
export type ChargeType = 'INITIAL' | 'RECURRING' | 'UNSCHEDULED';
export type ChargeStatus =
  | 'PENDING'
  | 'DUE'
  | 'RESERVED'
  | 'CHARGED'
  | 'PARTIALLY_CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'PROCESSING';
export type ProcessingMode = 'MULTIPLE_ATTEMPTS' | 'SINGLE_ATTEMPT';
export type ChargeFailureReason =
  | 'user_action_required'
  | 'charge_amount_too_high'
  | 'non_technical_error'
  | 'technical_error';

export interface AgreementInterval {
  unit: 'YEAR' | 'MONTH' | 'WEEK' | 'DAY';
  /** Integer from 1 to 31. */
  count: number;
}

/** GBP, USD and SEK are PSP-only; merchant integrations use NOK, DKK or EUR. */
export type AgreementPricing =
  | { type: 'LEGACY'; amount: number; currency: RecurringCurrency }
  | { type: 'VARIABLE'; suggestedMaxAmount: number; currency: RecurringCurrency }
  | { type: 'FLEXIBLE'; currency: RecurringCurrency };

export type AgreementPricingResponse =
  | Exclude<AgreementPricing, { type: 'VARIABLE' }>
  | (Extract<AgreementPricing, { type: 'VARIABLE' }> & { maxAmount?: number });

export type AgreementCampaign =
  | { type: 'PRICE_CAMPAIGN'; price: number; end: string }
  | { type: 'PERIOD_CAMPAIGN'; price: number; period: AgreementInterval }
  | { type: 'EVENT_CAMPAIGN'; price: number; eventDate: string; eventText: string };

/** Campaign read responses have their own schema, including computed expiry dates. */
export type AgreementCampaignResponse =
  | {
      type: 'PRICE_CAMPAIGN';
      price: number;
      end: string;
      /** @deprecated Text displayed in the app to explain the campaign. */
      explanation?: string;
    }
  | { type: 'PERIOD_CAMPAIGN'; price: number; end: string; period: AgreementInterval }
  | { type: 'EVENT_CAMPAIGN'; price: number; eventDate: string; eventText: string }
  | { type: 'LEGACY_CAMPAIGN'; price: number; end: string };

export interface InitialCharge {
  /** Integer minor units: 900 = NOK 9.00. */
  amount: number;
  /** Visible in the app; 1–100 characters. */
  description: string;
  transactionType: TransactionType;
  /** Optional unique merchant order ID; becomes the chargeId. */
  orderId?: string;
  externalId?: string;
}

export interface CreateAgreementRequest {
  pricing: AgreementPricing;
  interval?: AgreementInterval;
  /** At most 45 characters. */
  productName: string;
  /** At most 100 characters. */
  productDescription?: string;
  merchantRedirectUrl: string;
  /** HTTPS management page; required for Norwegian merchants. */
  merchantAgreementUrl?: string;
  phoneNumber?: string | null;
  initialCharge?: InitialCharge;
  /** Space-separated scopes, e.g. "name birthDate". */
  scope?: string;
  externalId?: string | null;
  campaign?: AgreementCampaign;
  isApp?: boolean;
  /** Requires sales-unit whitelisting by Vipps MobilePay. */
  skipLandingPage?: boolean;
  paymentMethod?: { blockedSources: 'COMMERCIAL_CARDS'[] } | null;
}

export interface CreateAgreementResponse {
  agreementId: string;
  uuid: string;
  vippsConfirmationUrl: string;
  chargeId?: string | null;
}

export interface AgreementEvent {
  occurred: string;
  event: 'CREATE' | 'ACTIVATE' | 'REJECT' | 'EXPIRE' | 'STOP';
  actor: 'MERCHANT' | 'USER' | 'ADMIN' | 'SYSTEM' | null;
}

export interface Agreement {
  /** Read responses use id; creation responses use agreementId. */
  id: string;
  uuid: string;
  status: AgreementStatus;
  pricing: AgreementPricingResponse;
  interval: AgreementInterval & { text?: string };
  productName: string;
  productDescription?: string;
  created: string;
  start?: string | null;
  stop?: string | null;
  merchantAgreementUrl: string;
  merchantRedirectUrl: string;
  sub?: string | null;
  userinfoUrl?: string | null;
  externalId?: string;
  countryCode: 'NO' | 'DK' | 'FI';
  vippsConfirmationUrl?: string;
  paymentMethod: { blockedSources: 'COMMERCIAL_CARDS'[] };
  history: AgreementEvent[];
  campaign?: AgreementCampaignResponse | null;
}

export interface ListAgreementsOptions {
  /** Defaults to ACTIVE at Vipps; query each status separately to list all agreements. */
  status?: AgreementStatus;
  /** Unix timestamp in milliseconds, not an ISO date. */
  createdAfter?: number;
  /** Starts at 1; use together with pageSize. */
  pageNumber?: number;
  /** 1–2000, default 500; use together with pageNumber. */
  pageSize?: number;
}

export interface UpdateAgreementRequest {
  /** Stopping is permanent; an agreement cannot be reactivated. */
  status?: 'STOPPED';
  pricing?: {
    /** New LEGACY price, in minor units. Currency/type cannot be changed. */
    amount?: number;
    /** New VARIABLE suggested maximum, in minor units. */
    suggestedMaxAmount?: number;
  };
  productName?: string;
  productDescription?: string;
  merchantAgreementUrl?: string;
  externalId?: string;
  interval?:
    | { type?: 'RECURRING'; period: AgreementInterval }
    | { type: 'FLEXIBLE'; period?: never };
}

interface ChargeRequestBase {
  /** Minor units; a LEGACY recurring charge cannot exceed five times the agreement price. */
  amount: number;
  /** Visible in the app; 1–100 characters. */
  description: string;
  transactionType: TransactionType;
  /** 1–64 alphanumeric/hyphen characters, unique per MSN; becomes chargeId. */
  orderId?: string;
  externalId?: string;
}

export type CreateChargeRequest = ChargeRequestBase &
  (
    | {
        type?: 'RECURRING';
        /**
         * YYYY-MM-DD, at least one day and at most two years ahead in production
         * and apitest. DIRECT_CAPTURE charges on this date; RESERVE_CAPTURE reserves.
         */
        due: string;
        /** Integer 0–14 days after due; Vipps recommends at least 2. SINGLE_ATTEMPT requires 0. */
        retryDays: number;
        processingMode?: ProcessingMode;
      }
    | { type: 'UNSCHEDULED'; due?: never; retryDays?: never; processingMode?: never }
  );

export interface CreateChargeResponse {
  chargeId: string;
}

export interface ChargeSummary {
  captured: number;
  refunded: number;
  cancelled: number;
}

export interface ChargeEvent {
  occurred: string;
  event: 'CREATE' | 'RESERVE' | 'CAPTURE' | 'REFUND' | 'CANCEL' | 'FAIL';
  amount: number;
  idempotencyKey: string;
  success: boolean;
  transactionId?: string;
  externalId?: string;
}

export interface Charge {
  /** Read responses use id; creation responses use chargeId. */
  id: string;
  agreementId: string;
  transactionId: string | null;
  amount: number;
  currency: RecurringCurrency;
  description: string;
  due: string;
  retryDays: number;
  processingMode: ProcessingMode;
  type: ChargeType;
  transactionType: TransactionType;
  status: ChargeStatus;
  externalId: string;
  externalAgreementId?: string;
  failureReason?: ChargeFailureReason | null;
  failureDescription?: string;
  summary: ChargeSummary;
  history: ChargeEvent[];
}

export interface ListChargesOptions {
  status?: ChargeStatus;
}

export interface CaptureChargeRequest {
  /** Full or partial reserved amount, in minor units. Only for RESERVE_CAPTURE charges. */
  amount: number;
  /** @deprecated Vipps uses the description supplied when creating the charge. */
  description?: string;
}

export interface RefundChargeRequest {
  /** Full or partial captured amount, in minor units. */
  amount: number;
  /** Required description of the refund, 1–100 characters. */
  description: string;
}

export interface ForceAcceptAgreementRequest {
  phoneNumber: string;
}
