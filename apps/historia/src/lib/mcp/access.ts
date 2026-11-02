/**
 * Who may use MCP. A key acts as the user it belongs to, with that user's
 * access, so it gives nothing the user does not already have. It is still a
 * long-lived credential, and an admin tool: only a user who may use the admin
 * (see access/adminAccess.ts) creates one, and a key stops working once its
 * user may no longer use the admin.
 */

import type { MCPAccessSettings } from '@payloadcms/plugin-mcp';
import { type CollectionConfig, UnauthorizedError } from 'payload';
import { adminPanelAccess, canAccessAdmin } from '@/access/adminAccess';
import type { User } from '@/payload-types';

/** For `overrideApiKeyCollection`: the plugin lets any logged-in user create a key. */
export function restrictMcpKeyCreation(collection: CollectionConfig): CollectionConfig {
  return {
    ...collection,
    access: { ...collection.access, create: adminPanelAccess },
  };
}

/** For `overrideAuth`: the plugin's own key check, then the key's user must pass the admin's. */
export async function requireAdminAccessForMcp(
  getDefaultMcpAccessSettings: () => Promise<MCPAccessSettings>,
): Promise<MCPAccessSettings> {
  const settings = await getDefaultMcpAccessSettings();
  if (!canAccessAdmin(settings.user as unknown as User)) {
    throw new UnauthorizedError();
  }
  return settings;
}
