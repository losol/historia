/**
 * Vipps OAuth Session Route
 *
 * Triggers Payload auth strategies to create a session from the temporary Vipps auth cookie.
 */

import { handleVippsSession } from '@eventuras/payload-vipps-auth';
import config from '@payload-config';
import { getPayload } from 'payload';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';
import { getAllowedVippsLoginDomains, getPublicRequestOrigin } from '../_utils/request-origin';

export async function GET(request: Request) {
  // The whole Vipps Login surface is off unless it is enabled, instead of failing with a 500.
  if (!getVippsLoginEnv().enabled) {
    return new Response('Not Found', { status: 404 });
  }

  const payload = await getPayload({ config });

  return handleVippsSession(request, payload, {
    adminPath: '/admin',
    onError: '/admin/login?error=auth_failed',
    getOrigin: (req) =>
      getPublicRequestOrigin(req, {
        allowedDomains: getAllowedVippsLoginDomains(),
      }),
  });
}
