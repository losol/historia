/**
 * Vipps Login API Route
 *
 * Initiates Vipps OAuth flow with PKCE
 */

import { handleVippsLogin, resolveConfig } from '@eventuras/payload-vipps-auth';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';
import { getAllowedVippsLoginDomains, getPublicRequestOrigin } from '../_utils/request-origin';

export async function GET(request: Request) {
  const origin = getPublicRequestOrigin(request, {
    allowedDomains: getAllowedVippsLoginDomains(),
  });

  const { clientId, clientSecret, environment } = getVippsLoginEnv();

  const config = resolveConfig({
    clientId,
    clientSecret,
    environment,
    redirectUri: `${origin}/api/auth/vipps/callback`,
  });

  return handleVippsLogin(request, config);
}
