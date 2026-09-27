import type { VippsConfig } from '../src/vipps-core';

const REQUIRED = [
  'VIPPS_CLIENT_ID',
  'VIPPS_CLIENT_SECRET',
  'VIPPS_MERCHANT_SERIAL_NUMBER',
  'VIPPS_SUBSCRIPTION_KEY',
] as const;

type RequiredVar = (typeof REQUIRED)[number];

/**
 * Same default as the app (see apps/historia/src/lib/vipps/config.ts): the test
 * environment, so a script cannot reach production by forgetting a variable.
 */
const DEFAULT_API_URL = 'https://apitest.vipps.no';

/**
 * Builds a VippsConfig from the environment for a CLI script.
 * Exits the process, listing what is missing, if a required variable is unset.
 */
export function vippsConfigFromEnv(systemName: string): VippsConfig {
  const values: Partial<Record<RequiredVar, string>> = {};
  const missing: RequiredVar[] = [];

  for (const key of REQUIRED) {
    const value = process.env[key];
    if (value) values[key] = value;
    else missing.push(key);
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    for (const key of missing) console.error(`   - ${key}`);
    process.exit(1);
  }

  const env = values as Record<RequiredVar, string>;

  return {
    apiUrl: process.env.VIPPS_API_URL || DEFAULT_API_URL,
    clientId: env.VIPPS_CLIENT_ID,
    clientSecret: env.VIPPS_CLIENT_SECRET,
    merchantSerialNumber: env.VIPPS_MERCHANT_SERIAL_NUMBER,
    subscriptionKey: env.VIPPS_SUBSCRIPTION_KEY,
    systemName,
    systemVersion: '1.0.0',
    pluginName: '',
    pluginVersion: '',
  };
}
