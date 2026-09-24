/**
 * Vipps OAuth Callback Route
 *
 * Handles OAuth callback, exchanges code for tokens, and creates user session
 */

import { handleVippsCallback, resolveConfig } from '@eventuras/payload-vipps-auth';
import config from '@payload-config';
import { getPayload } from 'payload';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';
import { getAllowedVippsLoginDomains, getPublicRequestOrigin } from '../_utils/request-origin';

export async function GET(request: Request) {
  const { enabled, clientId, clientSecret, environment } = getVippsLoginEnv();

  // The whole Vipps Login surface is off unless it is enabled, instead of failing with a 500.
  if (!enabled) {
    return new Response('Not Found', { status: 404 });
  }

  const origin = getPublicRequestOrigin(request, {
    allowedDomains: getAllowedVippsLoginDomains(),
  });

  const pluginConfig = resolveConfig({
    clientId,
    clientSecret,
    environment,
    redirectUri: `${origin}/api/auth/vipps/callback`,
  });

  const payload = await getPayload({ config });

  return handleVippsCallback(request, pluginConfig, payload);
}
