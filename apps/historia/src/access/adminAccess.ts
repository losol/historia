import type { PayloadRequest } from 'payload';
import type { User, Website } from '@/payload-types';
import { extractID } from '@/utilities/extractID';
import { isSystemAdmin } from './isSystemAdmin';

type UserLike = Pick<User, 'roles' | 'tenants'> | null | undefined;

/**
 * Whether the user has a role on a website: on `websiteId` when given, else on
 * any. Every site role counts, `member` too: a member is a reader, who reads the
 * site's content, drafts included, without changing anything (ADR 0001).
 */
export function hasSiteRole(user: UserLike, websiteId?: Website['id']): boolean {
  return Boolean(
    user?.tenants?.some(
      (row) =>
        row.tenant != null &&
        (row.siteRoles?.length ?? 0) > 0 &&
        (websiteId === undefined || String(extractID(row.tenant)) === String(websiteId)),
    ),
  );
}

/**
 * Who may use the admin: system admins, and users with a role on at least one
 * website. Being a user is not enough. Logging in through an identity provider
 * with signup on, or buying something through Vipps, makes a user with neither,
 * and such a user gets Payload's "not allowed to access the admin panel" page
 * until a system admin adds them to a website.
 */
export function canAccessAdmin(user: UserLike): boolean {
  return isSystemAdmin(user) || hasSiteRole(user);
}

/** `access.admin` on the users collection. */
export const adminPanelAccess = ({ req }: { req: PayloadRequest }): boolean =>
  Boolean(req.user && 'email' in req.user && canAccessAdmin(req.user as User));

/**
 * Whether the user may preview the drafts of a website, the one the request's
 * host serves: a system admin may preview any, everyone else only a website
 * they have a role on. Draft mode reads past access control, so this is the
 * check that keeps a site's drafts to its own people.
 */
export function canPreviewWebsite(user: UserLike, websiteId: Website['id'] | null): boolean {
  if (isSystemAdmin(user)) return true;
  return websiteId != null && hasSiteRole(user, websiteId);
}
