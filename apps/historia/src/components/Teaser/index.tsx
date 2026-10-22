import Link from 'next/link';
import { getDocUrl } from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';
import { Media } from '@/components/Media';
import type { Article, Case, Happening, Note, Topic } from '@/payload-types';
import { Teaser, type TeaserVariant } from './Teaser';

export type { TeaserVariant } from './Teaser';
export type TeaserDocument = Article | Happening | Note | Case;
export type TeaserCollection = 'articles' | 'happenings' | 'notes' | 'cases';

type DocTeaserProps = {
  doc: TeaserDocument;
  relationTo: TeaserCollection;
  locale: string;
  variant?: TeaserVariant;
  showImage?: boolean;
};

const intlLocale = (locale: string) => (locale === 'no' ? 'nb' : locale);

function formatDate(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Topic and date, as "Nyheter · 3. mai 2026". Happenings show when they start. */
function eyebrowFor(doc: TeaserDocument, locale: string): string | null {
  const parts: string[] = [];
  if ('topics' in doc) {
    const topic = doc.topics?.find((t): t is Topic => typeof t === 'object' && t !== null);
    if (topic?.title) parts.push(topic.title);
  }
  const date =
    'startDate' in doc
      ? formatDate(doc.startDate, locale)
      : 'publishedAt' in doc
        ? formatDate(doc.publishedAt, locale)
        : null;
  if (date) parts.push(date);
  return parts.length ? parts.join(' · ') : null;
}

const imageSizes: Record<TeaserVariant, string> = {
  lg: '(min-width: 56rem) 60vw, 100vw',
  md: '(min-width: 56rem) 33vw, 100vw',
  row: '6rem',
};

/** A Teaser for a document of one of the listed collections. */
export function DocTeaser({
  doc,
  relationTo,
  locale,
  variant = 'md',
  showImage = true,
}: DocTeaserProps) {
  if (!doc.slug) return null;

  const href = getDocUrl({
    locale,
    collection: relationTo,
    resourceId: doc.resourceId,
    slug: doc.slug,
  });
  const media = doc.image && typeof doc.image === 'object' ? doc.image.media : null;
  const image =
    showImage && media && typeof media === 'object' ? (
      <Media resource={media} size={imageSizes[variant]} priority={variant === 'lg'} />
    ) : undefined;

  return (
    <Teaser
      href={href}
      title={doc.title}
      eyebrow={eyebrowFor(doc, locale)}
      lead={'lead' in doc ? doc.lead : undefined}
      image={image}
      variant={variant}
      LinkComponent={Link}
    />
  );
}
