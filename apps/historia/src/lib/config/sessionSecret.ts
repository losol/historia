/**
 * What is wrong with SESSION_SECRET, or null when it is usable.
 *
 * The cart lives in a session cookie encrypted with this key (A256GCM, so exactly
 * 32 bytes, written as 64 hex characters). Without a usable key every cart action
 * fails at the first click, long after the deploy looked healthy.
 */
export function sessionSecretProblem(secret = process.env.SESSION_SECRET): string | null {
  if (!secret) return 'SESSION_SECRET is not set';
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) {
    return 'SESSION_SECRET must be 64 hex characters (32 bytes), e.g. from `openssl rand -hex 32`';
  }
  return null;
}
