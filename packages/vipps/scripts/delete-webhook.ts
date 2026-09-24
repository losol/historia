#!/usr/bin/env tsx

/**
 * Vipps Webhook Deletion Script
 *
 * Delete a registered webhook by ID.
 *
 * Usage:
 *   pnpm webhook:delete <webhook-id>
 *
 * Environment variables required:
 *   VIPPS_CLIENT_ID
 *   VIPPS_CLIENT_SECRET
 *   VIPPS_MERCHANT_SERIAL_NUMBER
 *   VIPPS_SUBSCRIPTION_KEY
 *   VIPPS_USE_TEST_MODE (optional, defaults to true)
 */

import { deleteWebhook } from '../src/webhooks-v1/client';
import { vippsConfigFromEnv } from './env';

async function main() {
  const webhookId = process.argv[2];

  if (!webhookId) {
    console.error('❌ Usage: pnpm tsx scripts/delete-webhook.ts <webhook-id>');
    console.error('\nTip: Use list-webhooks.ts to find webhook IDs');
    process.exit(1);
  }

  console.log('🗑️  Deleting Vipps Webhook\n');

  const config = vippsConfigFromEnv('vipps-webhook-delete');

  try {
    console.log(`⏳ Deleting webhook ${webhookId}...\n`);

    await deleteWebhook(config, webhookId);

    console.log('✅ Webhook deleted successfully!\n');
  } catch (error) {
    console.error('\n❌ Failed to delete webhook:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
