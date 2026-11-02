import { describe, expect, it } from 'vitest';
import { adminPanelAccess, canAccessAdmin, canPreviewWebsite, hasSiteRole } from './adminAccess';

const systemAdmin = { id: 1, email: 'root@example.com', roles: ['system-admin'], tenants: [] };
const member = {
  id: 2,
  email: 'reader@example.com',
  roles: [],
  tenants: [{ tenant: 'site-a', siteRoles: ['member'] }],
};
// A populated tenant, as `req.user` and the MCP key's user carry it.
const editor = {
  id: 3,
  email: 'editor@example.com',
  roles: [],
  tenants: [{ tenant: { id: 'site-b', name: 'B' }, siteRoles: ['editor'] }],
};
// What a login through an identity provider with signup on makes, or a Vipps checkout.
const newUser = { id: 4, email: 'new@example.com', roles: [], tenants: [] };
const noRolesRow = {
  id: 5,
  email: 'odd@example.com',
  roles: [],
  tenants: [{ tenant: 'site-a', siteRoles: [] }],
};
// A user of another auth collection, such as an MCP key: no email.
const otherCollection = { id: 'k1', roles: ['system-admin'] };

// biome-ignore lint/suspicious/noExplicitAny: fixtures carry only the fields read
const user = (fixture: unknown) => fixture as any;
// biome-ignore lint/suspicious/noExplicitAny: only the fields the access function reads are faked
const args = (fixture: unknown) => ({ req: { user: fixture } }) as any;

describe('hasSiteRole', () => {
  it('is any role on any website without a website given', () => {
    expect(hasSiteRole(user(member))).toBe(true);
    expect(hasSiteRole(user(editor))).toBe(true);
    expect(hasSiteRole(user(newUser))).toBe(false);
    expect(hasSiteRole(user({ email: 'x@example.com' }))).toBe(false);
    expect(hasSiteRole(null)).toBe(false);
  });

  it('is a role on that website with one given, populated or not', () => {
    expect(hasSiteRole(user(member), 'site-a')).toBe(true);
    expect(hasSiteRole(user(member), 'site-b')).toBe(false);
    expect(hasSiteRole(user(editor), 'site-b')).toBe(true);
  });

  it('does not count a website row without roles', () => {
    expect(hasSiteRole(user(noRolesRow))).toBe(false);
  });
});

describe('canAccessAdmin and adminPanelAccess', () => {
  it('let system admins and users with a site role in, the member reader too', () => {
    for (const fixture of [systemAdmin, member, editor]) {
      expect(canAccessAdmin(user(fixture))).toBe(true);
      expect(adminPanelAccess(args(fixture))).toBe(true);
    }
  });

  it('keep out a user with no role anywhere', () => {
    for (const fixture of [newUser, noRolesRow]) {
      expect(canAccessAdmin(user(fixture))).toBe(false);
      expect(adminPanelAccess(args(fixture))).toBe(false);
    }
  });

  it('keep out what is not a user', () => {
    expect(adminPanelAccess(args(otherCollection))).toBe(false);
    expect(adminPanelAccess(args(null))).toBe(false);
    expect(adminPanelAccess(args(undefined))).toBe(false);
  });
});

describe('canPreviewWebsite', () => {
  it('lets a system admin preview any website', () => {
    expect(canPreviewWebsite(user(systemAdmin), 'site-a')).toBe(true);
    expect(canPreviewWebsite(user(systemAdmin), null)).toBe(true);
  });

  it('lets everyone else preview only a website they have a role on', () => {
    expect(canPreviewWebsite(user(member), 'site-a')).toBe(true);
    expect(canPreviewWebsite(user(member), 'site-b')).toBe(false);
    expect(canPreviewWebsite(user(editor), 'site-b')).toBe(true);
    expect(canPreviewWebsite(user(editor), 'site-a')).toBe(false);
    expect(canPreviewWebsite(user(member), null)).toBe(false);
    expect(canPreviewWebsite(user(newUser), 'site-a')).toBe(false);
  });
});
