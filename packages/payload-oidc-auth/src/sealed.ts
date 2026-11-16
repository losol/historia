/**
 * Encrypts the small value the callback hands to the strategy, with the app's
 * `SESSION_SECRET`.
 *
 * fides-auth did this before 1.0 (`createEncryptedJWT`, `validateSessionJwt`);
 * 1.0 seals only its own sessions. The format is the one it used: a compact JWE,
 * `dir` with A256GCM, keyed by the 32 bytes the secret spells in hex.
 */

import { EncryptJWT, type JWTPayload, jwtDecrypt } from 'jose';

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not defined');
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) {
    throw new Error('SESSION_SECRET must be 32 bytes as hex (64 characters)');
  }
  return Uint8Array.from(secret.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

/** Seals a value that opens for `maxAgeSeconds` and not after. */
export async function seal(payload: JWTPayload, maxAgeSeconds: number): Promise<string> {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .encrypt(secretKey());
}

/** The payload, or null when the token has expired or was not sealed with this secret. */
export async function unseal(token: string): Promise<JWTPayload | null> {
  const key = secretKey();
  try {
    return (await jwtDecrypt(token, key)).payload;
  } catch {
    return null;
  }
}
