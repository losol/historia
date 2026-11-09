# @eventuras/vipps

Vipps MobilePay integration library for Eventuras.

## Structure

- **`epayment-v1/`** - Vipps MobilePay ePayment API v1 client
- **`recurring-v3/`** - Vipps MobilePay Recurring API v3 agreements and charges
- **`vipps-core/`** - Common utilities and helpers for Vipps integration
- **`webhooks-v1/`** - Webhook registration, signature verification and payload parsing

## Usage

### ePayment API v1

```typescript
import {
  createPayment,
  getPaymentDetails,
  capturePayment,
  cancelPayment,
  refundPayment,
  type CreatePaymentRequest,
  type PaymentDetails,
} from '@eventuras/vipps/epayment-v1';

// Configuration is passed via VippsConfig
const config = {
  apiUrl: 'https://apitest.vipps.no',
  merchantSerialNumber: 'YOUR_MSN',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  subscriptionKey: 'YOUR_SUBSCRIPTION_KEY',
  systemName: 'your-system',
  systemVersion: '1.0.0',
  pluginName: 'your-plugin',
  pluginVersion: '1.0.0',
};

// Create a payment
const payment = await createPayment(config, {
  amount: { value: 10000, currency: 'NOK' },
  paymentMethod: { type: 'WALLET' },
  reference: 'ORDER-123',
  returnUrl: 'https://example.com/return',
  userFlow: 'WEB_REDIRECT',
  paymentDescription: 'Order #123',
});

// Get payment details
const details = await getPaymentDetails(config, 'ORDER-123');

// Capture payment
await capturePayment(config, 'ORDER-123', {
  modificationAmount: { value: 10000, currency: 'NOK' },
});
```

### Recurring API v3

After the 0.3.0 release, civitas can install `@eventuras/vipps@^0.3.0` and import
the new client from **`@eventuras/vipps/recurring-v3`**. Use this on your backend
with the same `VippsConfig` as ePayment. The sales unit must have Recurring enabled.

```typescript
import { randomUUID } from 'node:crypto';
import {
  createAgreement,
  getAgreement,
  createCharge,
  updateAgreement,
} from '@eventuras/vipps/recurring-v3';
import { getUserInfo } from '@eventuras/vipps/vipps-core';

// Persist this key before sending; reuse it if the request needs a retry.
const agreementKey = randomUUID();
const agreement = await createAgreement(
  config,
  {
    pricing: { type: 'LEGACY', amount: 900, currency: 'NOK' }, // NOK 9.00
    interval: { unit: 'MONTH', count: 1 },
    productName: 'Individual membership',
    productDescription: 'Monthly membership, VAT included',
    merchantRedirectUrl: 'https://example.com/membership/return',
    merchantAgreementUrl: 'https://example.com/membership',
    scope: 'name birthDate',
    externalId: 'membership-123',
    initialCharge: {
      amount: 900,
      description: 'First month',
      transactionType: 'DIRECT_CAPTURE', // Requires direct capture on the sales unit.
    },
  },
  agreementKey,
);

// Redirect the customer to agreement.vippsConfirmationUrl to accept in the app.
// After acceptance, use a verified webhook or poll on the backend. A redirect
// alone does not prove acceptance; getAgreement can still return PENDING.
const details = await getAgreement(config, agreement.agreementId);
if (details.status === 'ACTIVE') {
  if (details.sub) {
    const user = await getUserInfo(config, details.sub);
    // Scope birthDate returns user.birthdate, not birthDate.
    // Store only the consented data you need; never log the profile.
  }

  // Your monthly job creates each later charge; Vipps does not schedule these.
  // Persist a separate key for each membership/billing period before sending.
  const chargeKey = randomUUID();
  const billingDate = new Date();
  billingDate.setUTCMonth(billingDate.getUTCMonth() + 1, 1);
  const due = billingDate.toISOString().slice(0, 10);
  const charge = await createCharge(
    config,
    agreement.agreementId,
    {
      amount: 900,
      description: 'Monthly membership',
      due, // The first day of next month, at least one day ahead.
      retryDays: 2,
      transactionType: 'DIRECT_CAPTURE',
      type: 'RECURRING',
      orderId: `membership-123-${due.slice(0, 7)}`,
    },
    chargeKey,
  );
  // Persist charge.chargeId for getCharge/cancelCharge/captureCharge/refundCharge.
}

// On cancellation (a separate request), stopping is permanent:
await updateAgreement(config, agreement.agreementId, { status: 'STOPPED' }, randomUUID());
```

All Recurring mutations require an `Idempotency-Key` (1–40 characters; no `#`,
`?`, `/` or `\`). Retry `createCharge` with **the same key and the same body**
after a network failure to avoid a duplicate charge. A new key is a new operation;
using an existing key with a different request can return 409. A cached 4xx response
is returned again for the same key. The client does not automatically retry.

Amounts are integer minor units: 900 øre means NOK 9.00, 1900 means NOK 19.00.
The currency belongs to agreement pricing; charges inherit it. `due` uses
`YYYY-MM-DD`, at least one day and at most two years ahead in production and
apitest. `retryDays` is 0–14; Vipps recommends at least 2. `SINGLE_ATTEMPT` requires
0 retries. A LEGACY recurring charge cannot exceed five times the agreement price.

`getAgreement` and `getCharge` return the API's `id` field; creation returns
`agreementId`/`chargeId`. `listAgreements` returns one page and accepts
`{ status?, createdAfter?, pageNumber?, pageSize? }`; `createdAfter` is a Unix
timestamp in **milliseconds**, and status defaults to ACTIVE at Vipps.
`listCharges(config, agreementId, { status? })` follows `Continuation-Token`
headers and returns the combined array, including any initial charge.

`cancelCharge(config, agreementId, chargeId, key)` uses **DELETE**, with no body.
`captureCharge(config, agreementId, chargeId, { amount }, key)` captures a full or
partial reservation for `RESERVE_CAPTURE`. `refundCharge(config, agreementId,
chargeId, { amount, description }, key)` refunds a full or partial captured amount.
Update, cancel, capture, refund and force-accept resolve with no value.

The apitest helper is `forceAcceptAgreement(config, agreementId, { phoneNumber },
key)`: **PATCH** `/recurring/v3/agreements/{agreementId}/accept`. It rejects
production URLs locally. The test user must have completed registration in the
test app. See [Recurring testing](docs/TESTING.md#recurring-api-v3) for the smoke script.

### Recurring webhooks

Subscribe with the existing `registerWebhook` function and the Recurring event
types exported from `@eventuras/vipps/webhooks-v1`. There are four agreement
events (activated, rejected, stopped, expired) and six charge events (reserved,
captured, canceled, refunded, failed, creation-failed). Note the single `l` in
`recurring.charge-canceled.v1`; the charge status itself is `CANCELLED`.

```typescript
import { verifyWebhookSignature, parseRecurringWebhookPayload } from '@eventuras/vipps/webhooks-v1';

// request includes the raw body, method, path/query and authentication headers.
if (!verifyWebhookSignature(request, webhookSecret)) throw new Error('Invalid signature');
const event = parseRecurringWebhookPayload(request.body);
// Discriminate on event.eventType and reconcile against getAgreement/getCharge.
```

The existing HMAC verification works unchanged. Recurring payloads have
`eventType`, `occurred`, `agreementId` and (for charges) an integer `amount`, rather
than ePayment's `name`, `timestamp`, `reference` and amount object. Use
`parseRecurringWebhookPayload`/`isValidRecurringWebhookPayload` for these; the
existing `parseWebhookPayload` remains specific to ePayment.

### Core Utilities

```typescript
import { getAccessToken, buildHeaders, type VippsConfig } from '@eventuras/vipps/vipps-core';

const config = {
  /* ... */
};

// Get access token
const token = await getAccessToken(config);

// Build headers for API requests
const headers = buildHeaders(config, token, 'optional-idempotency-key');
```

`getUserInfo(config, sub)` is also exported here. Request `scope: 'name birthDate'`
when creating the agreement and use the accepted agreement's `sub`. Userinfo
returns OIDC field names (`name`, `given_name`, `family_name`, `birthdate`). Fetch
promptly after consent; the documented window is 168 hours. The GET omits the
Recurring subscription key as required by the Recurring profile-sharing guide;
token acquisition still uses it. Unconsented fields can be absent and `[Expired]`
redaction markers are preserved. The new clients log operation/status/timing only,
without phone numbers, subjects, profiles or upstream error bodies. Returned errors
retain API error details, so callers should also avoid logging them unfiltered.

## Configuration

All functions accept a `VippsConfig` object:

```typescript
interface VippsConfig {
  apiUrl: string; // e.g., 'https://apitest.vipps.no' or 'https://api.vipps.no'
  merchantSerialNumber: string;
  clientId: string;
  clientSecret: string;
  subscriptionKey: string;
  systemName: string;
  systemVersion: string;
  pluginName: string;
  pluginVersion: string;
}
```

## API Reference

Verified against the current docs and Recurring OpenAPI 3.2.3 on 2026-11-07:

- [Recurring API specification](https://developer.vippsmobilepay.com/api/recurring/)
- [Recurring API guide](https://developer.vippsmobilepay.com/docs/APIs/recurring-api/recurring-api-guide/)
- [Userinfo specification](https://developer.vippsmobilepay.com/api/userinfo/)
- [Webhook event types](https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/events/)
- [ePayment API](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/)

The current spec uses `pricing: { amount }` for agreement price updates, without
`type`/`currency`. Some older guide examples show top-level price fields; this
client follows the current OpenAPI schema. The other details above (DELETE
cancellation, numeric `createdAfter`, Userinfo headers and response field names,
and recurring-specific webhook parsing) clarify the original civitas brief.

## Releases

The minor changeset targets **0.3.0** through the repository's normal version PR
and release workflow. No manual publishing is needed. npm's trusted publisher for
`@eventuras/vipps` must authorize `losol/historia`, workflow `historia.yml`,
environment `npm`, as for `@eventuras/historia-sdk`. A maintainer must bootstrap
the package/trusted publisher on npm if it does not exist yet. The package
allowlist is `files: ["dist"]`; source, scripts and `.env*` are not release content
(npm also includes its standard package metadata and README).
