import { describe, expect, it } from 'vitest';
import { sealSession, unsealSession } from './sealedSession';

const SECRET = 'c'.repeat(64);

// Sealed by fides-auth 0.14.1 (`createEncryptedJWT`) with SECRET: the session
// cookie of a visitor with a cart, as browsers hold it today.
const SEALED_BY_FIDES_AUTH_0_14 =
  'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..o4LeRa8xeM63Mw-X.N1T3Qwarlodar5YJPg6ZJOAyQoR6VvmdRGhkmPUoFcXH1lVwzhQpXrxrBrp3_tc3ccXkTKCpHCRXFYgXdiB6gmiZVBbCa6wrqJ1Q57ytL9YwVV5aET8TsuOonGaINNeKLLKqb8sT_N0_o2N7bChsY15SCkNp4ZMEY3tndyvl0dgJtqwE-mFAwhq5rBOV.0TKOFGai9d7vkz1HW0ufsw';

describe('the sealed visitor session', () => {
  it('opens a cookie fides-auth 0.x wrote, so carts survive the upgrade', async () => {
    expect(await unsealSession(SEALED_BY_FIDES_AUTH_0_14, SECRET)).toMatchObject({
      data: {
        sessionId: 'visitor-1',
        cart: { items: [{ productId: 'p1', quantity: 2 }], expiresAt: '2099-01-01T00:00:00.000Z' },
      },
    });
  });

  it('gives back what was sealed, in the same format', async () => {
    const token = await sealSession({ data: { cartId: 'c1' } }, SECRET);
    // A compact JWE with direct encryption: five parts, the second (the key) empty.
    expect(token.split('.')).toHaveLength(5);
    expect(token.split('.')[1]).toBe('');
    expect(token.split('.')[0]).toBe(SEALED_BY_FIDES_AUTH_0_14.split('.')[0]);
    expect(await unsealSession(token, SECRET)).toMatchObject({ data: { cartId: 'c1' } });
  });

  it('answers null for a cookie sealed with another secret, or one that is not a token', async () => {
    const token = await sealSession({ data: {} }, 'd'.repeat(64));
    expect(await unsealSession(token, SECRET)).toBeNull();
    expect(await unsealSession('nonsense', SECRET)).toBeNull();
  });

  it('refuses to work without a usable SESSION_SECRET', async () => {
    await expect(sealSession({}, '')).rejects.toThrow('SESSION_SECRET is not set');
    await expect(unsealSession('x', 'short')).rejects.toThrow('64 hex characters');
  });
});
