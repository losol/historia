import { afterEach, describe, expect, it } from 'vitest';
import { ensureFirstUserIsAdmin } from './ensureFirstUserIsAdmin';

type Identity = { provider: string; subject: string };

const run = (operation: string, users: number, value?: string[], identities?: Identity[]) => {
  const req = { payload: { find: async () => ({ totalDocs: users }) } };
  const data = identities ? { identities } : {};
  // biome-ignore lint/suspicious/noExplicitAny: only the fields the hook reads are faked
  return ensureFirstUserIsAdmin({ data, req, operation, value } as any);
};

const viaOidc = [{ provider: 'oidc', subject: 'abc' }];
const viaVipps = [{ provider: 'vipps', subject: 'abc' }];

const original = { ...process.env };
const synced = () => {
  process.env.OIDC_LOGIN_ENABLED = 'true';
  process.env.OIDC_SYSTEM_ADMIN_ROLE = 'historia-admin';
};
afterEach(() => {
  process.env = { ...original };
});

describe('ensureFirstUserIsAdmin', () => {
  it('makes the first user a system admin', async () => {
    await expect(run('create', 0)).resolves.toEqual(['system-admin']);
    await expect(run('create', 0, [], viaOidc)).resolves.toEqual(['system-admin']);
  });

  it('leaves later users as they are', async () => {
    await expect(run('create', 1, [])).resolves.toEqual([]);
    await expect(run('update', 0, [])).resolves.toEqual([]);
  });

  it('leaves a first user the provider creates to the provider when it owns the roles', async () => {
    synced();
    await expect(run('create', 0, [], viaOidc)).resolves.toEqual([]);
    await expect(run('create', 0, ['system-admin'], viaOidc)).resolves.toEqual(['system-admin']);
  });

  it('still bootstraps a first user created with a password when the provider owns the roles', async () => {
    synced();
    await expect(run('create', 0)).resolves.toEqual(['system-admin']);
    await expect(run('create', 0, [], viaVipps)).resolves.toEqual(['system-admin']);
  });

  it('still applies to a provider-created user when the login is off', async () => {
    process.env.OIDC_LOGIN_ENABLED = 'false';
    process.env.OIDC_SYSTEM_ADMIN_ROLE = 'historia-admin';
    await expect(run('create', 0, [], viaOidc)).resolves.toEqual(['system-admin']);
  });
});
