import type { CollectionSlug, Payload, Where } from 'payload';

/**
 * What a site serves from a collection: the website's own documents, or every
 * document of a collection shared between the sites (persons, organizations),
 * which has no tenant and is served on each of them. Only published documents,
 * unless `draft` is set for a preview, where the editor is signed in.
 *
 * Every query that answers a visitor goes through this, so another site's
 * document never renders by URL on this site, and an unpublished one never
 * renders at all.
 */
export function siteWhere(
  payload: Payload,
  collection: CollectionSlug,
  websiteId: string,
  options: { draft?: boolean } = {},
): Where {
  const { flattenedFields, versions } = payload.collections[collection].config;
  const conditions: Where[] = [];
  if (flattenedFields.some((field) => field.name === 'tenant')) {
    conditions.push({ tenant: { equals: websiteId } });
  }
  if (versions?.drafts && !options.draft) {
    conditions.push({ _status: { equals: 'published' } });
  }
  return { and: conditions };
}
