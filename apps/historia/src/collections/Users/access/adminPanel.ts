import type { PayloadRequest } from 'payload';
import { isSystemAdmin } from '@/access/isSystemAdmin';
import type { User } from '@/payload-types';
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs';

/**
 * Who may open the admin: system admins, and anyone with a role on a website.
 * Everybody else who logs in, such as a person who signed up through the
 * identity provider and has not been given a website, is a member of the
 * public site only. Their API access is unchanged and already limited by the
 * collections' own rules.
 */
export const adminPanelAccess = ({ req: { user } }: { req: PayloadRequest }): boolean => {
  if (!user || !('email' in user)) return false;
  return isSystemAdmin(user as User) || getUserTenantIDs(user as User).length > 0;
};
