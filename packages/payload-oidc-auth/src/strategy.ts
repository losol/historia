/**
 * The Payload auth strategy for one provider. It reads the pending-session
 * cookie the callback set, loads the user it names, opens a Payload session and
 * clears the cookie.
 *
 * @see https://payloadcms.com/docs/authentication/custom-strategies
 */

import { validateSessionJwt } from '@eventuras/fides-auth/session-validation';
import { getSessionSecret } from '@eventuras/fides-auth/utils';
import type { AuthStrategy, AuthStrategyResult } from 'payload';
import { v4 as uuidv4 } from 'uuid';
import { clearCookieHeader, parseCookies, pendingSessionCookie } from './cookies';
import type { PendingSession } from './handlers/callback';
import { createLogger } from './logger';
import { strategyName } from './provider';
import type { ResolvedOidcProvider } from './types';

/** A row in the collection's `sessions` array, as Payload stores it. */
type StoredSession = { id: string; createdAt?: string | null; expiresAt: string };

export function createOidcAuthStrategy(
  provider: Pick<ResolvedOidcProvider, 'name'>,
  collection = 'users',
): AuthStrategy {
  const name = strategyName(provider);
  const cookieName = pendingSessionCookie(provider.name);
  const log = createLogger('OidcAuthStrategy', provider.name);

  return {
    name,
    authenticate: async ({ payload, headers }) => {
      const token = parseCookies(headers).get(cookieName);
      if (!token) return { user: null };

      let pending: PendingSession;
      try {
        const { status, session } = await validateSessionJwt(token, getSessionSecret());
        if (status !== 'VALID' || !session) {
          log.warn({ status }, 'Invalid pending session');
          return { user: null };
        }
        pending = session as unknown as PendingSession;
      } catch (error) {
        log.error({ error }, 'Failed to decrypt the pending session');
        return { user: null };
      }

      if (pending.provider !== provider.name || !pending.user?.id) {
        return { user: null };
      }

      const user = await payload.findByID({
        collection,
        id: pending.user.id,
        overrideAccess: true,
        disableErrors: true,
      });
      if (!user) {
        log.warn({ userId: pending.user.id }, 'The pending session names a user that is gone');
        return { user: null };
      }

      log.info({ userId: user.id }, 'Authenticated');

      let sid: string | undefined;
      const authConfig = payload.collections[collection]?.config.auth;
      if (authConfig?.useSessions) {
        sid = uuidv4();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (authConfig.tokenExpiration || 7200) * 1000);
        const existing: StoredSession[] = Array.isArray(user.sessions) ? user.sessions : [];
        await payload.update({
          collection,
          id: user.id,
          data: {
            sessions: [
              ...existing.filter((s) => new Date(s.expiresAt) > now),
              { id: sid, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() },
            ],
          },
        });
      }

      // The cookie has done its job; clear it with the answer.
      const responseHeaders = new Headers();
      responseHeaders.append('Set-Cookie', clearCookieHeader(cookieName, false));

      return {
        user: {
          ...user,
          collection,
          _strategy: name,
          _sid: sid,
        } as AuthStrategyResult['user'],
        responseHeaders,
      };
    },
  };
}
