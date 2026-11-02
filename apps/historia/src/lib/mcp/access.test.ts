import type { MCPAccessSettings } from '@payloadcms/plugin-mcp';
import type { CollectionConfig } from 'payload';
import { UnauthorizedError } from 'payload';
import { describe, expect, it } from 'vitest';
import { requireAdminAccessForMcp, restrictMcpKeyCreation } from './access';

const settingsFor = (user: unknown) => async () => ({ user }) as unknown as MCPAccessSettings;

const editor = {
  id: 1,
  email: 'editor@example.com',
  roles: [],
  tenants: [{ tenant: { id: 'site-a' }, siteRoles: ['editor'] }],
};
const newUser = { id: 2, email: 'new@example.com', roles: [], tenants: [] };

// biome-ignore lint/suspicious/noExplicitAny: only the fields the access function reads are faked
const args = (user: unknown) => ({ req: { user } }) as any;

describe('restrictMcpKeyCreation', () => {
  const ownKeys = () => ({ user: { equals: 1 } });
  const collection = {
    slug: 'payload-mcp-api-keys',
    access: { create: () => true, read: ownKeys },
    fields: [],
  } as unknown as CollectionConfig;

  it('lets only users who may use the admin create a key', () => {
    const create = restrictMcpKeyCreation(collection).access?.create;
    expect(create?.(args(editor))).toBe(true);
    expect(create?.(args(newUser))).toBe(false);
    expect(create?.(args(null))).toBe(false);
  });

  it('keeps the rest of the collection as the plugin made it', () => {
    const restricted = restrictMcpKeyCreation(collection);
    expect(restricted.slug).toBe('payload-mcp-api-keys');
    expect(restricted.access?.read).toBe(ownKeys);
  });
});

describe('requireAdminAccessForMcp', () => {
  it('passes the settings through for a user who may use the admin', async () => {
    await expect(requireAdminAccessForMcp(settingsFor(editor))).resolves.toEqual({ user: editor });
  });

  it('refuses the key of a user who may not', async () => {
    await expect(requireAdminAccessForMcp(settingsFor(newUser))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('lets the plugin refuse an unknown key itself', async () => {
    const unknownKey = async (): Promise<MCPAccessSettings> => {
      throw new UnauthorizedError();
    };
    await expect(requireAdminAccessForMcp(unknownKey)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
