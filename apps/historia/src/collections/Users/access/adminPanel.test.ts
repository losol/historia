import { describe, expect, it } from 'vitest';
import { adminPanelAccess } from './adminPanel';

// biome-ignore lint/suspicious/noExplicitAny: only the fields the access function reads are faked
const access = (user: unknown) => adminPanelAccess({ req: { user } } as any);

describe('adminPanelAccess', () => {
  it('lets a system admin in', () => {
    expect(access({ id: 'a', email: 'root@example.com', roles: ['system-admin'] })).toBe(true);
  });

  it('lets in anyone with a role on a website, a member included', () => {
    for (const siteRoles of [['admin'], ['editor'], ['commerce'], ['member']]) {
      const user = { id: 'b', email: 'site@example.com', tenants: [{ tenant: 'w1', siteRoles }] };
      expect(access(user), siteRoles.join()).toBe(true);
    }
  });

  it('keeps out a user with no website and no global role', () => {
    expect(access({ id: 'c', email: 'kari@example.com', roles: [], tenants: [] })).toBe(false);
    expect(access({ id: 'c', email: 'kari@example.com' })).toBe(false);
  });

  it('keeps out a request without a user, or one from another auth collection', () => {
    expect(access(null)).toBe(false);
    expect(access({ id: 'k1', roles: ['system-admin'] })).toBe(false);
  });
});
