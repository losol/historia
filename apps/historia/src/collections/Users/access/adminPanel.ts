import type { PayloadRequest } from 'payload';
import { isSystemAdmin } from '@/access/isSystemAdmin';
import type { User } from '@/payload-types';
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs';

/**
 * Who may open the admin: system admins, and anyone with a role on a website.
 * Everybody else who logs in, such as a person who signed up through the
 * identity provider and has not been given a website, is a signed-in visitor
 * of the public site only. What they may do through the API is held to what
 * a visitor may, outside their own documents, by
 * access/signedInWithoutRole.test.ts.
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return isSystemAdmin(user) || getUserTenantIDs(user).length > 0;
}

/** `access.admin` on the users collection. */
export const adminPanelAccess = ({ req: { user } }: { req: PayloadRequest }): boolean =>
  Boolean(user && 'email' in user && canAccessAdmin(user as User));
