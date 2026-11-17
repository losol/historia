import { beforeEach, describe, expect, it, vi } from 'vitest';

// The Vipps client is replaced: these tests are about what the provider asks of
// it, not about Vipps.
const getUserInfo = vi.fn();
const constructed: unknown[] = [];
vi.mock('@eventuras/fides-auth/providers/vipps', async (importOriginal) => {
  const original = await importOriginal<typeof import('@eventuras/fides-auth/providers/vipps')>();
  return {
    ...original,
    VippsLoginClient: class {
      constructor(config: unknown) {
        constructed.push(config);
      }
      getUserInfo = getUserInfo;
    },
  };
});

const { vippsProvider } = await import('../provider');

/** An unsigned JWT with these claims: the provider only reads `sub` from it. */
const idToken = (claims: Record<string, unknown>) =>
  ['{"alg":"none"}', JSON.stringify(claims)]
    .map((part) => Buffer.from(part).toString('base64url'))
    .concat('')
    .join('.');

const client = () => {
  const provider = vippsProvider({
    clientId: 'cid',
    clientSecret: 'secret',
    subscriptionKey: 'key',
    merchantSerialNumber: '123',
  });
  return provider.createClient?.(
    { ...provider, scope: 'openid', basePath: '/api/auth/vipps' } as never,
    'https://shop.example.com/api/auth/vipps/callback',
  );
};

beforeEach(() => {
  getUserInfo.mockReset().mockResolvedValue({ sub: 'vipps-sub' });
  constructed.length = 0;
});

describe('vippsProvider', () => {
  it('has the issuer under the API address, not the address itself', () => {
    expect(vippsProvider({ clientId: 'c', clientSecret: 's' }).issuer).toBe(
      'https://apitest.vipps.no/access-management-1.0/access/',
    );
  });

  it('gives the client the redirect URI, the subscription key and the merchant', () => {
    client();
    expect(constructed[0]).toMatchObject({
      redirectUri: 'https://shop.example.com/api/auth/vipps/callback',
      subscriptionKey: 'key',
      merchantSerialNumber: '123',
    });
  });

  it('asks for the user the ID token names', async () => {
    const tokens = {
      access_token: 'at',
      token_type: 'bearer',
      id_token: idToken({ sub: 'vipps-sub' }),
    };
    await client()?.getUserInfo(tokens as never);
    expect(getUserInfo).toHaveBeenCalledWith('at', { expectedSubject: 'vipps-sub' });
  });

  it('does not ask without an access token or an ID token', async () => {
    await expect(client()?.getUserInfo({ token_type: 'bearer' } as never)).rejects.toThrow(
      'no access token',
    );
    await expect(
      client()?.getUserInfo({ access_token: 'at', token_type: 'bearer' } as never),
    ).rejects.toThrow('no ID token');
    expect(getUserInfo).not.toHaveBeenCalled();
  });
});
