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
  const origin = getPublicRequestOrigin(request, {
    allowedDomains: getAllowedVippsLoginDomains(),
  });

  const { clientId, clientSecret, environment } = getVippsLoginEnv();

  const pluginConfig = resolveConfig({
    clientId,
    clientSecret,
    environment,
    redirectUri: `${origin}/api/auth/vipps/callback`,
  });

  const payload = await getPayload({ config });

  return handleVippsCallback(request, pluginConfig, payload);
}
