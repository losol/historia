import { Logger } from '@eventuras/logger';
import configPromise from '@payload-config';
import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import { isSystemAdmin } from '@/access/isSystemAdmin';
import type { User } from '@/payload-types';

const logger = Logger.create({
  namespace: 'historia:observability',
  context: { module: 'sentryCheck' },
});

/**
 * Check that Sentry receives events from this deployment: sends one test event and
 * says whether Sentry is on, with the environment and release it reports under.
 * Open /api/sentry-check in the browser while logged in as a system admin, then look
 * for "Sentry check" in Sentry.
 */
export async function GET() {
  const payload = await getPayload({ config: configPromise });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user || !('email' in user) || !isSystemAdmin(user as User)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = Sentry.getClient();
  if (!client) {
    return NextResponse.json({
      enabled: false,
      reason: 'Sentry is not initialised: set SENTRY_DSN in the environment and restart.',
    });
  }

  const options = client.getOptions();
  const eventId = Sentry.captureMessage('Sentry check', {
    level: 'info',
    tags: { check: 'sentry-check' },
  });
  // Serverless and short-lived requests can end before the event is sent.
  const delivered = await Sentry.flush(5000);

  logger.info({ eventId, delivered }, 'Sentry check event sent');
  return NextResponse.json({
    enabled: true,
    eventId,
    delivered,
    environment: options.environment ?? 'production',
    release: options.release ?? null,
  });
}
