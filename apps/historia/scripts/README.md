# Historia Scripts

Utility scripts for Historia CMS development and operations.

## Vipps Payment Tools

### Vipps Checkout E2E Test

Drives a real browser through a running site (staging) and the Vipps **test**
environment:

1. Add a product to the cart.
2. Start the Vipps payment.
3. Approve it.
4. Return to the site and wait for the order confirmation.
5. Check that the cart was emptied.
6. Cancel the test payment again.

With `--scenario=abort` it cancels the payment before approval and checks that
the site says the payment failed.

**Usage:**
```bash
pnpm e2e:vipps --base-url https://staging.example.no
pnpm e2e:vipps --base-url https://staging.example.no --scenario=abort
pnpm e2e:vipps --base-url https://staging.example.no --headed --keep
```

**Required Environment Variables** (the same Vipps test merchant as the site):
```bash
VIPPS_CLIENT_ID=<test-client-id>
VIPPS_CLIENT_SECRET=<test-client-secret>
VIPPS_SUBSCRIPTION_KEY=<test-subscription-key>
VIPPS_MERCHANT_SERIAL_NUMBER=<test-msn>
VIPPS_TEST_PHONE=4712345678   # the MT test user
```

**Approval:**
- The payment is approved with Vipps' [force approve](https://developer.vippsmobilepay.com/docs/APIs/epayment-api/api-guide/operations/force-approve/) endpoint.
- It only works in the test environment. The script refuses a `VIPPS_API_URL` that is not `apitest`.
- The test user must have approved one payment by hand in the MT app first.
- Vipps does not support force approve for Express, and the checkout offers shipping options in Vipps. When Vipps refuses, the script says so and waits for you to approve the payment in the MT app (`--approve-timeout`, default 180 s).

**Browser:** run `pnpm exec playwright-core install chromium` once, or point `PLAYWRIGHT_CHROMIUM_EXECUTABLE` at a Chromium.

### Get Payment Details

Fetch detailed information about a Vipps payment using the payment reference.

**Usage:**
```bash
pnpm vipps:get-payment <payment-reference>
```

**Example:**
```bash
pnpm vipps:get-payment acme-shop-123-order-3456
```

**Required Environment Variables:**
```bash
VIPPS_CLIENT_ID=<your-client-id>
VIPPS_CLIENT_SECRET=<your-client-secret>
VIPPS_SUBSCRIPTION_KEY=<your-subscription-key>
VIPPS_MERCHANT_SERIAL_NUMBER=<your-msn>
VIPPS_API_URL=https://apitest.vipps.no  # Optional; https://api.vipps.no for production
```

**Output:**
- Payment state and status
- Authorized, captured, refunded, and cancelled amounts
- Customer profile information (if shared)
- Shipping details (if provided)
- Complete payment event history

**Use Cases:**
- Debug orphaned payments in production
- Verify payment status without accessing the database
- Check what customer information was shared via Vipps
- Review shipping details provided by customer
- Investigate payment issues reported by customers

---

## Database Seed Scripts

### Seed Shipping Products

Create default shipping products for Vipps checkout.

**Usage:**
```bash
DATABASE_URI="your-db-uri" CMS_SECRET="your-secret" pnpm tsx scripts/seed-shipping-products.ts
```

---

## Configuration

### Generate Config Types

Generate TypeScript types from app config schema.

**Usage:**
```bash
pnpm generate:config-types
```
