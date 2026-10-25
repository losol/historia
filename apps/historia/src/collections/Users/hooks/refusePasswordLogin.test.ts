import { APIError } from 'payload';
import { afterEach, describe, expect, it } from 'vitest';
import { refusePasswordLogin } from './refusePasswordLogin';

const fakeReq = (users = 1) => {
  const errors: string[] = [];
  const req = {
    context: {} as Record<string, unknown>,
    payload: {
      logger: { error: (message: string) => errors.push(message) },
      count: async () => ({ totalDocs: users }),
    },
  };
  return { req, errors };
};

const run = (operation: string, req = fakeReq().req) => {
  const args = { collection: 'users' };
  // biome-ignore lint/suspicious/noExplicitAny: only the fields the hook reads are faked
  return { result: () => refusePasswordLogin({ args, operation, req } as any), args };
};

const original = { ...process.env };
const off = () => {
  process.env.PASSWORD_LOGIN_ENABLED = 'false';
  process.env.OIDC_LOGIN_ENABLED = 'true';
};
afterEach(() => {
  process.env = { ...original };
});

describe('refusePasswordLogin', () => {
  it('lets password operations through by default', async () => {
    const { result, args } = run('login');
    await expect(result()).resolves.toBe(args);
  });

  it('answers 403 to login, forgot and reset password when off', async () => {
    off();
    for (const operation of ['login', 'forgotPassword', 'resetPassword']) {
      const { result } = run(operation);
      await expect(result()).rejects.toMatchObject({ status: 403 });
      await expect(result()).rejects.toBeInstanceOf(APIError);
    }
  });

  it('leaves every other operation alone when off', async () => {
    off();
    for (const operation of ['read', 'update', 'refresh', 'logout', 'create']) {
      const { result, args } = run(operation);
      await expect(result()).resolves.toBe(args);
    }
  });

  it('lets the first user log in on the request that created it', async () => {
    off();
    const { req } = fakeReq(0);
    await run('create', req).result();
    const { result, args } = run('login', req);
    await expect(result()).resolves.toBe(args);
  });

  it('does not mark a create when users exist', async () => {
    off();
    const { req } = fakeReq(1);
    await run('create', req).result();
    await expect(run('login', req).result()).rejects.toMatchObject({ status: 403 });
  });

  it('keeps password login on, and logs, when no identity provider is enabled', async () => {
    process.env.PASSWORD_LOGIN_ENABLED = 'false';
    process.env.OIDC_LOGIN_ENABLED = 'false';
    process.env.VIPPS_LOGIN_ENABLED = 'false';
    const { req, errors } = fakeReq();
    const { result, args } = run('login', req);
    await expect(result()).resolves.toBe(args);
    expect(errors).toHaveLength(1);
  });
});
