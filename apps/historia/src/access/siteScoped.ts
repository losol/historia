import type { Access, PayloadRequest, Where } from 'payload';
import type { Website } from '@/payload-types';
import { findWebsiteForHost } from '@/utilities/findWebsiteForHost';
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs';
import { getRequestHost } from '@/utilities/requestHost';
import { isSystemAdmin } from './isSystemAdmin';

/** The field that names a document's website: `tenant` on content, `id` on the websites. */
type SiteField = 'id' | 'tenant';

/**
 * Scopes a read to the website the request was made to.
 *
 * One deployment serves every site, so `GET /api/pages` on one site's domain
 * answered with every site's pages, and `/api/websites` listed them all. The
 * content is public, but a domain should only serve its own site: the request's
 * host names a website through its `domains`, and the read is constrained to
 * that website. A host no website is configured for reads nothing.
 *
 * Users signed in to the admin are not scoped by host. The admin is one for all
 * sites, and the multi-tenant plugin already constrains members to the websites
 * they belong to; system admins see everything.
 *
 * The Local API called outside a request carries no host and stays unscoped, as
 * before: server code reading for a visitor filters by tenant itself (see
 * `findPurchasableProducts`), and the seed reads across sites.
 *
 * @example
 * access: {
 *   read: siteScoped(anyone),
 *   read: siteScoped(authenticatedOrPublished), // drafts for signed-in users
 *   read: siteScoped(anyone, 'id'), // on the websites collection
 * }
 */
export const siteScoped =
  (access: Access, field: SiteField = 'tenant'): Access =>
  async (args) => {
    const result = await access(args);
    if (result === false) return false;

    const site = await siteConstraint(args.req, field);
    if (site === true) return result;
    if (site === false) return false;
    return result === true ? site : { and: [result, site] };
  };

async function siteConstraint(req: PayloadRequest, field: SiteField): Promise<Where | boolean> {
  const { user } = req;
  if (user && 'email' in user && (isSystemAdmin(user) || getUserTenantIDs(user).length > 0)) {
    return true;
  }

  const host = getRequestHost(req.headers);
  if (!host) return true;

  const website = await websiteOfRequest(req, host);
  return website ? { [field]: { equals: website.id } } : false;
}

/** One lookup per request: the access runs again for every relationship a read populates. */
const websiteByRequest = new WeakMap<PayloadRequest, Promise<Website | null>>();

function websiteOfRequest(req: PayloadRequest, host: string): Promise<Website | null> {
  let website = websiteByRequest.get(req);
  if (!website) {
    website = findWebsiteForHost(req.payload, host, { depth: 0 });
    websiteByRequest.set(req, website);
  }
  return website;
}
