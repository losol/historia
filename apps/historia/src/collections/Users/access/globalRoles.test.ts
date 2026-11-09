import { afterEach, describe, expect, it } from 'vitest';
import { globalRolesCreateAccess, globalRolesUpdateAccess, hasOidcIdentity } from './globalRoles';

const systemAdmin = { id: 1, email: 'root@example.com', roles: ['system-admin'] };
const siteAdmin = {
  id: 2,
  email: 'site@example.com',
  roles: [],
  tenants: [{ tenant: 10, siteRoles: ['admin'] }],
};
const apiKeyOnlyUser = { id: 3, roles: ['system-admin'] };
const oidcUser = {
  email: 'kari@example.com',
  identities: [{ provider: 'oidc', subject: 'x' }],
};

// biome-ignore lint/suspicious/noExplicitAny: only the fields the access functions read are faked
const args = (user: unknown, doc?: unknown) => ({ req: { user }, doc }) as any;

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

describe('globalRolesCreateAccess', () => {
  it('lets only a system admin set roles on a new user', () => {
    expect(globalRolesCreateAccess(args(systemAdmin))).toBe(true);
    expect(globalRolesCreateAccess(args(siteAdmin))).toBe(false);
    expect(globalRolesCreateAccess(args(null))).toBe(false);
    expect(globalRolesCreateAccess(args(apiKeyOnlyUser))).toBe(false);
  });
});

describe('globalRolesUpdateAccess', () => {
  it('lets only a system admin change roles', () => {
    expect(globalRolesUpdateAccess(args(systemAdmin, siteAdmin))).toBe(true);
    expect(globalRolesUpdateAccess(args(siteAdmin, siteAdmin))).toBe(false);
    expect(globalRolesUpdateAccess(args(siteAdmin, systemAdmin))).toBe(false);
    expect(globalRolesUpdateAccess(args(null, siteAdmin))).toBe(false);
  });

  it('refuses everyone on an OIDC user while the provider owns the roles', () => {
    process.env.OIDC_LOGIN_ENABLED = 'true';
    process.env.OIDC_SYSTEM_ADMIN_ROLE = 'historia-admin';
    expect(globalRolesUpdateAccess(args(systemAdmin, oidcUser))).toBe(false);
    expect(globalRolesUpdateAccess(args(systemAdmin, siteAdmin))).toBe(true);
  });

  it('lets a system admin change an OIDC user when the provider does not own the roles', () => {
    expect(globalRolesUpdateAccess(args(systemAdmin, oidcUser))).toBe(true);
  });
});

describe('hasOidcIdentity', () => {
  it('looks for the generic provider only', () => {
    expect(hasOidcIdentity(oidcUser)).toBe(true);
    expect(hasOidcIdentity({ identities: [{ provider: 'vipps', subject: 'x' }] })).toBe(false);
    expect(hasOidcIdentity({})).toBe(false);
    expect(hasOidcIdentity(undefined)).toBe(false);
  });
});
