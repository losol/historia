import { revalidateTag } from 'next/cache';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

// The tags the sitemap routes cache under; see lib/sitemap. `expire: 0` drops the
// entry at once; the default profile serves it stale one more time.
const tagsFor = (collection: string): string[] => {
  if (collection === 'pages') return ['pages-sitemap'];
  if (collection === 'articles') return ['articles-sitemap', 'collections-sitemap'];
  return ['collections-sitemap'];
};

// Listed in a sitemap: published, or from a collection without drafts.
const listed = (doc?: { _status?: string | null } | null): boolean =>
  Boolean(doc) && (doc?._status === undefined || doc?._status === 'published');

// On create there is no document before this one. Payload passes `{}` as
// `previousDoc` then, which has no `_status` and would read as listed: every new
// draft expired the caches. That is more than waste. With autosave, Payload
// creates the draft while it renders the admin's create view, and Next refuses
// revalidateTag during render, so the view came up without a form.
export const revalidateSitemap: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  operation,
  collection,
  req: { context },
}) => {
  const wasListed = operation === 'update' && listed(previousDoc);
  if (!context.disableRevalidate && (listed(doc) || wasListed)) {
    for (const tag of tagsFor(collection.slug)) revalidateTag(tag, { expire: 0 });
  }
  return doc;
};

export const revalidateSitemapAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  collection,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    for (const tag of tagsFor(collection.slug)) revalidateTag(tag, { expire: 0 });
  }
  return doc;
};
