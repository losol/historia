/**
 * Logging in must not give more than visiting the site does. Anyone can get a
 * user without a role: an OIDC or Vipps login with signup on makes one, and so
 * does a Vipps checkout. Payload's default, for a collection or job that sets no
 * access of its own, is that every logged-in user may do everything, so a
 * plugin that adds a collection quietly opens it to all of them. This test
 * checks every collection in the built config, the plugins' included, against
 * an anonymous visitor, so the next one is caught here.
 */

import type { PayloadRequest, SanitizedConfig } from 'payload';
import { beforeAll, describe, expect, it } from 'vitest';
import configPromise from '@/payload.config';

type Grant = 'none' | 'own' | 'all';
const rank: Record<Grant, number> = { none: 0, own: 1, all: 2 };

const operations = ['create', 'read', 'readVersions', 'update', 'delete', 'unlock'] as const;
type Operation = (typeof operations)[number];

/**
 * What a user without a role may do beyond a visitor, and why. `own` is a query
 * constraint: their own documents only.
 */
const allowed: Record<string, Partial<Record<Operation, Grant>>> = {
  // Their own user: to see and edit their profile.
  users: { read: 'own', update: 'own', unlock: 'own' },
  // Their own admin preferences, such as column choices.
  'payload-preferences': { create: 'all', read: 'own', update: 'own', delete: 'own' },
  // MCP keys they made while they could use the admin; a key stops working once
  // they cannot (lib/mcp/access.ts).
  'payload-mcp-api-keys': { read: 'own', update: 'own', delete: 'own', unlock: 'own' },
  // Payload's own record of who is editing which document. Its access cannot be
  // configured; it holds document IDs and the editing user's ID, nothing else.
  'payload-locked-documents': { create: 'all', read: 'all', update: 'all', delete: 'all' },
};

const signedInWithoutRole = {
  id: 'no-role',
  email: 'kari@example.com',
  collection: 'users',
  roles: [],
  tenants: [],
};

let config: SanitizedConfig;

beforeAll(async () => {
  config = await configPromise;
});

/** The request an access function sees: no host, and one website in the database. */
function requestFor(user: unknown): PayloadRequest {
  const payload = {
    config,
    collections: {},
    db: { defaultIDType: 'text' },
    // An install with a website, so the first-website bootstrap does not apply.
    find: async () => ({ docs: [], totalDocs: 1 }),
    findByID: async () => null,
    count: async () => ({ totalDocs: 1 }),
  };
  return {
    user,
    payload,
    headers: new Headers(),
    context: {},
    query: {},
  } as unknown as PayloadRequest;
}

async function grantOf(
  access: ((args: { req: PayloadRequest }) => unknown) | undefined,
  user: unknown,
): Promise<Grant> {
  if (!access) return 'none';
  const result = await access({ req: requestFor(user) });
  if (result === true) return 'all';
  if (result && typeof result === 'object') return 'own';
  return 'none';
}

describe('a logged-in user without a role', () => {
  it('may do no more than a visitor, outside their own documents', async () => {
    const extra: string[] = [];
    for (const collection of config.collections) {
      // Not served over REST or GraphQL, such as payload-migrations: only server
      // code reaches it.
      if (collection.endpoints === false && collection.graphQL === false) continue;
      const access = collection.access as Partial<
        Record<Operation, (args: { req: PayloadRequest }) => unknown>
      >;
      for (const operation of operations) {
        // Operations the collection does not have: no versions, or not an auth collection.
        if (operation === 'readVersions' && !collection.versions) continue;
        if (operation === 'unlock' && !collection.auth) continue;
        const visitor = await grantOf(access[operation], null);
        const user = await grantOf(access[operation], signedInWithoutRole);
        const limit = allowed[collection.slug]?.[operation] ?? visitor;
        if (rank[user] > Math.max(rank[visitor], rank[limit])) {
          extra.push(`${collection.slug}.${operation}: ${user} (a visitor: ${visitor})`);
        }
      }
    }
    expect(extra).toEqual([]);
  });

  it('may not run, queue or cancel jobs', async () => {
    const { access } = config.jobs;
    const asUser = { req: requestFor(signedInWithoutRole) };
    expect(await access?.run?.(asUser as never)).toBeFalsy();
    expect(await access?.queue?.(asUser as never)).toBeFalsy();
    expect(await access?.cancel?.(asUser as never)).toBeFalsy();
  });

  it('may not open the admin', async () => {
    const users = config.collections.find((collection) => collection.slug === 'users');
    expect(await users?.access.admin?.({ req: requestFor(signedInWithoutRole) })).toBe(false);
  });
});
