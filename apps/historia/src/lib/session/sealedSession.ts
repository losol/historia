import { EncryptJWT, jwtDecrypt } from 'jose';
import { sessionSecretProblem } from '@/lib/config/sessionSecret';

/**
 * Seals what the visitor's session cookie holds, and opens it again.
 *
 * The format is the one fides-auth 0.x wrote for Historia: a compact JWE, `dir`
 * with A256GCM, keyed by the 32 bytes `SESSION_SECRET` spells in hex. Keeping it
 * means the cookies visitors already have, and the carts in them, still open.
 * 0.x set no expiry inside the token; a session sealed here has one, as long as
 * the cookie's own lifetime.
 */

/** How long a visitor's session lasts, for the token and for its cookie. */
export const VISITOR_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function keyFrom(secret: string | undefined): Uint8Array {
  const problem = sessionSecretProblem(secret);
  if (problem) throw new Error(problem);
  return Uint8Array.from((secret as string).match(/../g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );
}

export async function sealSession(
  session: Record<string, unknown>,
  secret = process.env.SESSION_SECRET,
): Promise<string> {
  return new EncryptJWT(session)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${VISITOR_SESSION_MAX_AGE}s`)
    .encrypt(keyFrom(secret));
}

/** What the token holds, or null when it has expired or was not sealed with this secret. */
export async function unsealSession(
  token: string,
  secret = process.env.SESSION_SECRET,
): Promise<Record<string, unknown> | null> {
  const key = keyFrom(secret);
  try {
    return (await jwtDecrypt(token, key)).payload;
  } catch {
    return null;
  }
}
