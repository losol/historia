import { describe, expect, it } from 'vitest';
import { isSystemAdmin, isSystemAdminAccess, systemAdminsFieldLevel } from './isSystemAdmin';

const systemAdmin = { id: 'u1', email: 'root@example.com', roles: ['system-admin'] };
const siteAdmin = {
  id: 'u2',
  email: 'site@example.com',
  roles: [],
  tenants: [{ tenant: 10, siteRoles: ['admin'] }],
};
// An API key of another auth collection: no email, so never a system admin.
const otherCollection = { id: 'k1', roles: ['system-admin'] };

// biome-ignore lint/suspicious/noExplicitAny: only the fields the access functions read are faked
const args = (user: unknown) => ({ req: { user } }) as any;

describe('isSystemAdmin', () => {
  it('is the system-admin role on a user', () => {
    // biome-ignore lint/suspicious/noExplicitAny: fixtures carry only the fields read
    expect(isSystemAdmin(systemAdmin as any)).toBe(true);
    // biome-ignore lint/suspicious/noExplicitAny: fixtures carry only the fields read
    expect(isSystemAdmin(siteAdmin as any)).toBe(false);
    expect(isSystemAdmin(null)).toBe(false);
  });
});

describe('isSystemAdminAccess and systemAdminsFieldLevel', () => {
  it('let only a system admin from the users collection through', () => {
    for (const access of [isSystemAdminAccess, systemAdminsFieldLevel]) {
      expect(access(args(systemAdmin))).toBe(true);
      expect(access(args(siteAdmin))).toBe(false);
      expect(access(args(otherCollection))).toBe(false);
      expect(access(args(null))).toBe(false);
      expect(access(args(undefined))).toBe(false);
    }
  });
});
