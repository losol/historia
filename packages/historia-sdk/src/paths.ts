// Where the website shows a document, as Historia's own pages link to it (its
// pageCollections and generatePreviewPath): a collection's documents under /c/ and
// the collection's localised name, as `slug--resourceId`; pages at their slug.

const SEGMENTS: Record<string, Record<string, string>> = {
  no: { articles: 'artikler', cases: 'spor', notes: 'notert', products: 'produkter' },
  en: { articles: 'articles', cases: 'cases', notes: 'notes', products: 'products' },
};

/** The localised name a collection's pages are under, as `notert` for notes in `no`. */
export function collectionSegment(collection: string, locale: string): string | null {
  return SEGMENTS[locale]?.[collection] ?? SEGMENTS.en?.[collection] ?? null;
}

/**
 * A document's page on the website: `/no/c/notert/dugnad--x7k2p`, `/no/om-oss`. Null for a
 * collection without pages of its own, or a document without a slug.
 */
export function documentUrl(
  collection: string,
  doc: { slug?: string | null; resourceId?: string | null },
  baseUrl: string,
  locale: string,
): string | null {
  if (!doc.slug) return null;
  if (collection === 'pages') return `${baseUrl}/${locale}/${doc.slug}`;
  const segment = collectionSegment(collection, locale);
  if (!segment) return null;
  const slug = doc.resourceId ? `${doc.slug}--${doc.resourceId}` : doc.slug;
  return `${baseUrl}/${locale}/c/${segment}/${slug}`;
}
