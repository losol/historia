import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/cart/types';
import { sealSession, unsealSession } from './sealedSession';

/**
 * The visitor's session: an encrypted cookie that holds the cart and what else
 * has to follow a visitor who is not logged in. It is not a login. Logins are
 * Payload's, with its own cookie.
 *
 * fides-auth kept this cookie before 1.0. From 1.0 it only makes a session out
 * of a login at an identity provider, so the cookie is Historia's own, with the
 * same name, format and lifetime as before.
 */
export interface VisitorSession {
  data?: SessionData & { sessionId?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export const VISITOR_SESSION_COOKIE = 'session';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/** Browsers drop a cookie whose name and value reach this size, without a word. */
const COOKIE_MAX_BYTES = 4096;

/** The visitor's session, or null when there is none or the cookie cannot be opened. */
export async function readVisitorSession(): Promise<VisitorSession | null> {
  const token = (await cookies()).get(VISITOR_SESSION_COOKIE)?.value;
  if (!token) return null;
  return (await unsealSession(token)) as VisitorSession | null;
}

/** Writes the session cookie. Only where cookies can be set: an action or a route handler. */
export async function writeVisitorSession(session: VisitorSession): Promise<void> {
  const token = await sealSession(session);
  const size = Buffer.byteLength(`${VISITOR_SESSION_COOKIE}=${token}`);
  if (size >= COOKIE_MAX_BYTES) {
    throw new Error(`The session cookie would be ${size} bytes, which browsers do not keep`);
  }
  (await cookies()).set(VISITOR_SESSION_COOKIE, token, {
    path: '/',
    maxAge: THIRTY_DAYS,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
  });
}
