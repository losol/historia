import type { User, Website } from '@/payload-types';
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs';
import { isSystemAdmin } from './isSystemAdmin';

/**
 * Whether the user may preview the drafts of a website, the one the request's
 * host serves. Draft mode reads past access control, so this is the check that
 * keeps a site's drafts to its own people: a system admin may preview any site,
 * everyone else only one they have a role on, `member` included. Being logged
 * in is not enough, since anyone can be through an identity provider.
 */
export function canPreviewWebsite(
  user: User | null | undefined,
  websiteId: Website['id'] | null | undefined,
): boolean {
  if (!user) return false;
  if (isSystemAdmin(user)) return true;
  if (websiteId == null) return false;
  return getUserTenantIDs(user).some((id) => String(id) === String(websiteId));
}
