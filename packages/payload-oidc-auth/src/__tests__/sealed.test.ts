import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seal, unseal } from '../sealed';

const SECRET = 'a'.repeat(64);

describe('seal and unseal', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });
  afterEach(() => {
    process.env.SESSION_SECRET = SECRET;
    vi.useRealTimers();
  });

  it('gives back what was sealed', async () => {
    const token = await seal({ provider: 'idp', user: { id: 'u1' } }, 60);
    expect(token.split('.')).toHaveLength(5);
    expect(await unseal(token)).toMatchObject({ provider: 'idp', user: { id: 'u1' } });
  });

  it('answers null for a token sealed with another secret, or no token at all', async () => {
    const token = await seal({ provider: 'idp' }, 60);
    process.env.SESSION_SECRET = 'b'.repeat(64);
    expect(await unseal(token)).toBeNull();
    expect(await unseal('not-a-token')).toBeNull();
  });

  it('stops opening when its time is up', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T12:00:00Z') });
    const token = await seal({ provider: 'idp' }, 60);

    vi.setSystemTime(new Date('2026-01-01T12:00:59Z'));
    expect(await unseal(token)).toMatchObject({ provider: 'idp' });
    vi.setSystemTime(new Date('2026-01-01T12:01:01Z'));
    expect(await unseal(token)).toBeNull();
  });

  it('refuses a secret that is not 32 bytes as hex', async () => {
    process.env.SESSION_SECRET = 'too-short';
    await expect(seal({}, 60)).rejects.toThrow('SESSION_SECRET must be 32 bytes as hex');
    process.env.SESSION_SECRET = '';
    await expect(unseal('x')).rejects.toThrow('SESSION_SECRET is not defined');
  });
});
