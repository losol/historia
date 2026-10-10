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

export const revalidateSitemap: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
  req: { context },
}) => {
  if (!context.disableRevalidate && (listed(doc) || listed(previousDoc))) {
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
