#!/usr/bin/env tsx
/**
 * CLI tool to fetch Vipps payment details
 *
 * Usage:
 *   pnpm payment:get <payment-reference>
 *
 * Example:
 *   pnpm payment:get acme-shop-123-order-3456
 *
 * Environment variables required (from .env file):
 *   VIPPS_CLIENT_ID
 *   VIPPS_CLIENT_SECRET
 *   VIPPS_SUBSCRIPTION_KEY
 *   VIPPS_MERCHANT_SERIAL_NUMBER (MSN)
 *   VIPPS_USE_TEST_MODE (optional, defaults to true)
 */

import { getPaymentDetails } from '../src/epayment-v1/client.js';
import { vippsConfigFromEnv } from './env.js';

async function main() {
  const paymentReference = process.argv[2];

  if (!paymentReference) {
    console.error('Error: Payment reference is required');
    console.error('\nUsage: pnpm payment:get <payment-reference>');
    console.error('\nExample:');
    console.error('  pnpm payment:get acme-shop-123-order-3456');
    process.exit(1);
  }

  const config = vippsConfigFromEnv('vipps-payment-get');

  try {
    const payment = await getPaymentDetails(config, paymentReference);
    console.log(JSON.stringify(payment, null, 2));
  } catch (error) {
    console.error('Error: Failed to fetch payment details');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
