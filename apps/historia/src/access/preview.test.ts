import { describe, expect, it } from 'vitest';
import { canPreviewWebsite } from './preview';

const systemAdmin = { id: 1, email: 'root@example.com', roles: ['system-admin'], tenants: [] };
const reader = {
  id: 2,
  email: 'reader@example.com',
  roles: [],
  tenants: [{ tenant: 'site-a', siteRoles: ['member'] }],
};
// A populated tenant, as `payload.auth` returns it.
const editor = {
  id: 3,
  email: 'editor@example.com',
  roles: [],
  tenants: [{ tenant: { id: 'site-b', name: 'B' }, siteRoles: ['editor'] }],
};
// Logged in on the public site, with no role anywhere.
const visitor = { id: 4, email: 'kari@example.com', roles: [], tenants: [] };

// biome-ignore lint/suspicious/noExplicitAny: fixtures carry only the fields read
const user = (fixture: unknown) => fixture as any;

describe('canPreviewWebsite', () => {
  it('lets a system admin preview any website', () => {
    expect(canPreviewWebsite(user(systemAdmin), 'site-a')).toBe(true);
    expect(canPreviewWebsite(user(systemAdmin), null)).toBe(true);
  });

  it('lets everyone else preview only a website they have a role on', () => {
    expect(canPreviewWebsite(user(reader), 'site-a')).toBe(true);
    expect(canPreviewWebsite(user(reader), 'site-b')).toBe(false);
    expect(canPreviewWebsite(user(editor), 'site-b')).toBe(true);
    expect(canPreviewWebsite(user(editor), 'site-a')).toBe(false);
  });

  it('refuses a host no website serves, a user without a role, and no user', () => {
    expect(canPreviewWebsite(user(reader), null)).toBe(false);
    expect(canPreviewWebsite(user(visitor), 'site-a')).toBe(false);
    expect(canPreviewWebsite(null, 'site-a')).toBe(false);
  });
});
