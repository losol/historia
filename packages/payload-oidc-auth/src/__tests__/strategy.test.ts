import { createEncryptedJWT } from '@eventuras/fides-auth/utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { createOidcAuthStrategy } from '../strategy';
import { fakePayload } from './fake-payload';

const SECRET = 'a'.repeat(64);

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

const headersWith = (cookie: string) => new Headers({ cookie });

const pendingCookie = async (provider: string, userId: string) =>
  `__${provider}_session_pending=${await createEncryptedJWT({ provider, user: { id: userId } }, SECRET)}`;

describe('createOidcAuthStrategy', () => {
  const strategy = createOidcAuthStrategy({ name: 'idp' });

  it('is named after the provider', () => {
    expect(strategy.name).toBe('oidc-idp');
  });

  it('skips requests without its cookie', async () => {
    const { payload, calls } = fakePayload();
    const result = await strategy.authenticate({ payload, headers: new Headers() } as never);

    expect(result.user).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('logs the named user in, opens a session and clears the cookie', async () => {
    const { payload, docs } = fakePayload([{ id: 'u1', email: 'kari@example.com' }]);
    const result = await strategy.authenticate({
      payload,
      headers: headersWith(await pendingCookie('idp', 'u1')),
    } as never);

    expect(result.user).toMatchObject({ id: 'u1', collection: 'users', _strategy: 'oidc-idp' });
    expect(result.user?._sid).toBeTruthy();
    expect(docs.get('u1')?.sessions).toHaveLength(1);
    expect(result.responseHeaders?.get('set-cookie')).toContain('__idp_session_pending=;');
  });

  it('ignores a cookie made for another provider', async () => {
    const { payload } = fakePayload([{ id: 'u1', email: 'kari@example.com' }]);
    const result = await strategy.authenticate({
      payload,
      headers: headersWith(await pendingCookie('vipps', 'u1')),
    } as never);

    expect(result.user).toBeNull();
  });

  it('ignores a cookie that is not ours', async () => {
    const { payload } = fakePayload([{ id: 'u1', email: 'kari@example.com' }]);
    const result = await strategy.authenticate({
      payload,
      headers: headersWith('__idp_session_pending=not-a-token'),
    } as never);

    expect(result.user).toBeNull();
  });

  it('gives up when the user is gone', async () => {
    const { payload } = fakePayload();
    const result = await strategy.authenticate({
      payload,
      headers: headersWith(await pendingCookie('idp', 'u1')),
    } as never);

    expect(result.user).toBeNull();
  });
});
