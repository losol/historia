#!/usr/bin/env tsx
/**
 * End-to-end test of the Vipps checkout against a running site (staging), using the
 * Vipps test environment.
 *
 * It drives a real browser through the shop: adds a product to the cart, starts the
 * Vipps payment from checkout, approves the payment in Vipps, returns to the site and
 * waits for the order confirmation. With `--scenario=abort` it cancels the payment
 * instead and waits for the site to say it failed.
 *
 * Approval uses Vipps' force approve endpoint (test environment only):
 * POST /epayment/v1/test/payments/{reference}/approve
 * https://developer.vippsmobilepay.com/docs/APIs/epayment-api/api-guide/operations/force-approve/
 * Vipps does not support it for Express, and the checkout offers shipping options
 * in Vipps. When Vipps refuses, the script waits for the payment to be approved by
 * hand in the Vipps MT test app instead (up to --approve-timeout seconds).
 *
 * Usage:
 *   pnpm e2e:vipps --base-url https://staging.example.no
 *   pnpm e2e:vipps --base-url https://staging.example.no --scenario=abort
 *
 * Options:
 *   --base-url <url>        The site to test (or E2E_BASE_URL). Required.
 *   --locale <locale>       Locale path segment. Default: no
 *   --product-url <url>     A product page to buy. Default: the first product listed.
 *   --scenario <name>       approve (default) or abort
 *   --keep                  Leave the approved payment reserved. By default it is
 *                           cancelled afterwards, so no test money stays reserved.
 *   --approve-timeout <s>   How long to wait for manual approval. Default: 180
 *   --headed                Show the browser.
 *
 * Environment (the same Vipps test merchant as the site uses; never commit these):
 *   VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY,
 *   VIPPS_MERCHANT_SERIAL_NUMBER
 *   VIPPS_TEST_PHONE        The MT test user's phone number, e.g. 4712345678. The
 *                           user must have approved one payment in the MT app by hand
 *                           before force approve works for them.
 *   VIPPS_API_URL           Optional. Must be the test environment (apitest).
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE  Optional path to Chromium. Otherwise run
 *                           `pnpm exec playwright-core install chromium` once.
 *
 * Exit code 0 when the scenario passed, 1 when it failed.
 */

import { parseArgs } from 'node:util';
import {
  cancelPayment,
  forceApprovePayment,
  getPaymentDetails,
} from '@eventuras/vipps/epayment-v1';
import type { VippsConfig } from '@eventuras/vipps/vipps-core';
import { type Browser, chromium, type Page } from 'playwright-core';

const { values: args } = parseArgs({
  options: {
    'base-url': { type: 'string' },
    locale: { type: 'string', default: 'no' },
    'product-url': { type: 'string' },
    scenario: { type: 'string', default: 'approve' },
    keep: { type: 'boolean', default: false },
    'approve-timeout': { type: 'string', default: '180' },
    headed: { type: 'boolean', default: false },
  },
});

const baseUrl = (args['base-url'] ?? process.env.E2E_BASE_URL ?? '').replace(/\/$/, '');
const locale = args.locale ?? 'no';
const scenario = args.scenario === 'abort' ? 'abort' : 'approve';
const approveTimeoutMs = Number(args['approve-timeout']) * 1000;

function step(message: string) {
  console.log(`\n▶ ${message}`);
}
function ok(message: string) {
  console.log(`  ✓ ${message}`);
}
class E2EFailure extends Error {}

/** Stop the run: main() reports it, closes the browser and exits with 1. */
function fail(message: string): never {
  throw new E2EFailure(message);
}

function vippsConfig(): VippsConfig {
  const {
    VIPPS_CLIENT_ID: clientId,
    VIPPS_CLIENT_SECRET: clientSecret,
    VIPPS_SUBSCRIPTION_KEY: subscriptionKey,
    VIPPS_MERCHANT_SERIAL_NUMBER: merchantSerialNumber,
  } = process.env;
  if (!clientId || !clientSecret || !subscriptionKey || !merchantSerialNumber) {
    fail(
      'Missing Vipps test credentials: set VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY and VIPPS_MERCHANT_SERIAL_NUMBER.',
    );
  }
  const apiUrl = process.env.VIPPS_API_URL || 'https://apitest.vipps.no';
  // Force approve and test payments only exist in the test environment; refuse to
  // touch production even by mistake.
  if (!apiUrl.includes('apitest')) {
    fail(`VIPPS_API_URL must be the Vipps test environment, got ${apiUrl}.`);
  }
  return {
    apiUrl,
    clientId,
    clientSecret,
    subscriptionKey,
    merchantSerialNumber,
    systemName: 'historia',
    systemVersion: '1.0.0',
    pluginName: 'historia-e2e-vipps',
    pluginVersion: '1.0.0',
  };
}

async function waitForState(
  config: VippsConfig,
  reference: string,
  accept: (state: string) => boolean,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let state = '';
  while (Date.now() < deadline) {
    state = (await getPaymentDetails(config, reference)).state;
    if (accept(state)) return state;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return state;
}

/** Add a product to the cart and start the Vipps payment; returns its reference. */
async function startPayment(page: Page): Promise<string> {
  step('Add a product to the cart');
  let productUrl = args['product-url'];
  if (!productUrl) {
    await page.goto(`${baseUrl}/${locale}/c/produkter`, { waitUntil: 'networkidle' });
    const href = await page
      .locator(`a[href^="/${locale}/c/produkter/"]`)
      .first()
      .getAttribute('href')
      .catch(() => null);
    if (!href) fail('No product found on the product listing; pass --product-url.');
    productUrl = `${baseUrl}${href}`;
  }
  await page.goto(productUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Legg i handlekurv' }).click();
  await page.getByRole('button', { name: 'Legg til en' }).waitFor({ timeout: 30_000 });
  ok(`Added ${productUrl}`);

  step('Start the Vipps payment from checkout');
  await page.goto(`${baseUrl}/${locale}/checkout`, { waitUntil: 'networkidle' });
  const buy = page.getByRole('button', { name: /Vipps/ });
  await buy.waitFor({ timeout: 30_000 });
  // The button stays disabled until the cart has reached the server and is priced.
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent?.includes('Vipps') && !b.disabled,
      ),
    undefined,
    { timeout: 30_000 },
  );

  // The payment's reference comes back in the server action's answer. Read it on
  // the way to the page: right after, the page sends the browser to Vipps' landing
  // page (which this test does not need), and the answer can no longer be read.
  await page.route(/vipps\.no|mobilepay\./, (route) => route.abort());
  let resolveBody: (body: string) => void = () => {};
  const actionBody = new Promise<string>((resolve) => {
    resolveBody = resolve;
  });
  await page.route(`${baseUrl}/${locale}/checkout`, async (route) => {
    const request = route.request();
    if (request.method() !== 'POST' || !request.headers()['next-action']) {
      return route.continue();
    }
    const response = await route.fetch();
    const text = await response.text();
    await route.fulfill({ response, body: text });
    if (text.includes('"reference"') || text.includes('"success":false')) resolveBody(text);
  });
  await buy.click();
  const body = await Promise.race([
    actionBody,
    new Promise<string>((resolve) => setTimeout(() => resolve(''), 60_000)),
  ]);
  await page.unroute(`${baseUrl}/${locale}/checkout`);
  const reference = body.match(/"reference":"([^"]+)"/)?.[1];
  if (!reference) {
    const error = body.match(/"message":"([^"]+)"/)?.[1];
    fail(`Checkout did not create a payment${error ? `: ${error}` : ''}.`);
  }
  ok(`Payment created: ${reference}`);
  return reference;
}

async function approve(config: VippsConfig, reference: string) {
  step('Approve the payment in Vipps');
  const phone = process.env.VIPPS_TEST_PHONE;
  if (!phone) fail('Set VIPPS_TEST_PHONE to the MT test user to approve with.');
  try {
    await forceApprovePayment(config, reference, phone);
    ok('Force approved');
  } catch (error) {
    console.log(`  ! Force approve was refused: ${error instanceof Error ? error.message : error}`);
    console.log(
      `  → Approve the payment by hand in the Vipps MT app (${phone}); waiting up to ${approveTimeoutMs / 1000}s.`,
    );
  }
  const state = await waitForState(
    config,
    reference,
    (s) => s === 'AUTHORIZED' || s === 'ABORTED' || s === 'EXPIRED' || s === 'TERMINATED',
    approveTimeoutMs,
  );
  if (state !== 'AUTHORIZED') fail(`Payment is ${state || 'unknown'}, not AUTHORIZED.`);
  ok('Payment is AUTHORIZED in Vipps');
}

/** Open the return page and wait for one of `expected` texts. */
async function returnToSite(page: Page, reference: string, expected: RegExp, what: string) {
  step(`Return to the site and wait for ${what}`);
  await page.unroute(/vipps\.no|mobilepay\./);
  await page.goto(`${baseUrl}/${locale}/checkout/vipps?reference=${reference}`);
  try {
    await page.getByText(expected).first().waitFor({ timeout: 90_000 });
  } catch {
    const text = (
      await page
        .locator('main')
        .innerText()
        .catch(() => '')
    ).replace(/\s+/g, ' ');
    fail(`The return page did not show ${what}. It shows: ${text.slice(0, 300)}`);
  }
  // The page empties the cart with a request of its own; leaving before it answers
  // would drop the new session cookie.
  await page.waitForLoadState('networkidle');
  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  ok(text.slice(0, 160));
}

async function main() {
  let browser: Browser | undefined;
  let reference: string | undefined;
  try {
    if (!baseUrl) fail('Pass --base-url (or set E2E_BASE_URL) to the site to test.');
    const config = vippsConfig();
    console.log(`Vipps checkout e2e: ${scenario} against ${baseUrl}`);

    browser = await chromium.launch({
      headless: !args.headed,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const page = await browser.newPage();
    reference = await startPayment(page);

    if (scenario === 'approve') {
      await approve(config, reference);
      await returnToSite(page, reference, /Takk for din bestilling/, 'the order confirmation');

      step('Check that the cart was emptied');
      await page.goto(`${baseUrl}/${locale}/checkout`, { waitUntil: 'networkidle' });
      await page.getByText('Handlekurven din er tom').waitFor({ timeout: 30_000 });
      ok('Cart is empty');

      if (!args.keep) {
        step('Cancel the test payment');
        await cancelPayment(config, reference);
        ok('Cancelled, nothing stays reserved');
      }
    } else {
      step('Cancel the payment before it is approved');
      await cancelPayment(config, reference);
      const state = await waitForState(config, reference, (s) => s !== 'CREATED', 30_000);
      ok(`Payment is ${state} in Vipps`);
      await returnToSite(
        page,
        reference,
        /Betalingen ble (avbrutt|avsluttet)|Betalingssesjonen har utløpt/,
        'that the payment failed',
      );
    }

    console.log(`\n✓ Vipps checkout e2e (${scenario}) passed. Reference: ${reference}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n✗ ${message}${reference ? ` (reference ${reference})` : ''}`);
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}

main();
