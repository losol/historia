import { afterEach, describe, expect, it } from 'vitest';
import { ensureFirstUserIsAdmin } from './ensureFirstUserIsAdmin';

const run = (operation: string, users: number, value?: string[]) => {
  const req = { payload: { find: async () => ({ totalDocs: users }) } };
  // biome-ignore lint/suspicious/noExplicitAny: only the fields the hook reads are faked
  return ensureFirstUserIsAdmin({ req, operation, value } as any);
};

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

describe('ensureFirstUserIsAdmin', () => {
  it('makes the first user a system admin', async () => {
    await expect(run('create', 0)).resolves.toEqual(['system-admin']);
  });

  it('leaves later users as they are', async () => {
    await expect(run('create', 1, [])).resolves.toEqual([]);
    await expect(run('update', 0, [])).resolves.toEqual([]);
  });

  it('stays out of it when the OIDC provider is the source of the roles', async () => {
    process.env.OIDC_LOGIN_ENABLED = 'true';
    process.env.OIDC_SYSTEM_ADMIN_ROLE = 'historia-admin';
    await expect(run('create', 0, [])).resolves.toEqual([]);
    await expect(run('create', 0, ['system-admin'])).resolves.toEqual(['system-admin']);
  });

  it('still applies when the role is set but the login is off', async () => {
    process.env.OIDC_LOGIN_ENABLED = 'false';
    process.env.OIDC_SYSTEM_ADMIN_ROLE = 'historia-admin';
    await expect(run('create', 0)).resolves.toEqual(['system-admin']);
  });
});
