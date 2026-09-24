#!/usr/bin/env tsx

/**
 * Vipps Webhook Management Script
 *
 * List all registered webhooks for the configured MSN.
 *
 * Usage:
 *   pnpm webhook:list
 *
 * Environment variables required:
 *   VIPPS_CLIENT_ID
 *   VIPPS_CLIENT_SECRET
 *   VIPPS_MERCHANT_SERIAL_NUMBER
 *   VIPPS_SUBSCRIPTION_KEY
 *   VIPPS_USE_TEST_MODE (optional, defaults to true)
 */

import { listWebhooks } from '../src/webhooks-v1/client';
import { vippsConfigFromEnv } from './env';

async function main() {
  console.log('🔍 Listing Vipps Webhooks\n');

  const config = vippsConfigFromEnv('vipps-webhook-list');

  try {
    console.log('⏳ Fetching webhooks...\n');

    const response = await listWebhooks(config);
    const webhooks = response.webhooks;

    if (webhooks.length === 0) {
      console.log('📭 No webhooks registered\n');
      return;
    }

    console.log(`📋 Found ${webhooks.length} webhook(s):\n`);

    webhooks.forEach((webhook, i) => {
      console.log(`${i + 1}. Webhook Details:`);
      console.log(`   ID:         ${webhook.id}`);
      console.log(`   URL:        ${webhook.url}`);
      console.log(`   Created:    ${new Date(webhook.createdAt).toLocaleString('no-NO')}`);
      console.log(`   Events (${webhook.events.length}):`);
      webhook.events.forEach((event) => {
        console.log(`               - ${event}`);
      });
      console.log('');
    });

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total webhooks: ${webhooks.length}`);
    const allEvents = new Set(webhooks.flatMap((w) => w.events));
    console.log(`   Unique events:  ${allEvents.size}`);
    console.log(`   Events covered: ${Array.from(allEvents).join(', ')}\n`);
  } catch (error) {
    console.error('\n❌ Failed to list webhooks:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
