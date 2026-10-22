/**
 * Enough of Payload's Local API for the user and strategy logic: an in-memory
 * users collection with `find`, `findByID`, `create` and `update`, matching the
 * `where` shapes the package uses.
 */

import type { Payload } from 'payload';

type Doc = Record<string, unknown> & { id: string };

function valueAt(doc: Doc, path: string): unknown[] {
  // `identities.provider` reaches into every row of the array.
  const [head, ...rest] = path.split('.');
  const value = doc[head as string];
  if (rest.length === 0) return [value];
  if (Array.isArray(value)) {
    return value.flatMap((row) => valueAt(row as Doc, rest.join('.')));
  }
  return value && typeof value === 'object' ? valueAt(value as Doc, rest.join('.')) : [];
}

function matches(doc: Doc, where: Record<string, unknown>): boolean {
  if (Array.isArray(where.and)) {
    return (where.and as Record<string, unknown>[]).every((w) => matches(doc, w));
  }
  return Object.entries(where).every(([path, condition]) => {
    const { equals } = condition as { equals: unknown };
    return valueAt(doc, path).includes(equals);
  });
}

export function fakePayload(initial: Doc[] = [], authConfig: Record<string, unknown> = {}) {
  const docs = new Map(initial.map((doc) => [doc.id, { ...doc }]));
  let nextId = initial.length + 1;
  const calls: { method: string; args: Record<string, unknown> }[] = [];

  const payload = {
    collections: { users: { config: { auth: { useSessions: true, ...authConfig } } } },
    async find(args: { where: Record<string, unknown>; limit?: number }) {
      calls.push({ method: 'find', args });
      const found = [...docs.values()].filter((doc) => matches(doc, args.where));
      return { docs: found.slice(0, args.limit ?? 10) };
    },
    async findByID(args: { id: string }) {
      calls.push({ method: 'findByID', args });
      return docs.get(args.id) ?? null;
    },
    async create(args: { data: Record<string, unknown> }) {
      calls.push({ method: 'create', args });
      const doc = { id: `u${nextId++}`, ...args.data };
      docs.set(doc.id, doc);
      return doc;
    },
    async update(args: { id: string; data: Record<string, unknown> }) {
      calls.push({ method: 'update', args });
      const doc = { ...(docs.get(args.id) as Doc), ...args.data };
      docs.set(args.id, doc);
      return doc;
    },
  };

  return { payload: payload as unknown as Payload, docs, calls };
}
