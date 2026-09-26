import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next/types';
import { generateMeta } from '@/lib/seo';
import { getCurrentWebsite } from '@/lib/website';
import { CollectionListing } from '../../CollectionListing';
import { getOriginalCollectionName } from '../../pageCollections';

type Args = {
  params: Promise<{
    locale: string;
    collection: string;
    pageNumber: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Readonly<Args>) {
  const { locale, collection, pageNumber } = await paramsPromise;
  const page = Number(pageNumber);

  if (!Number.isInteger(page) || page < 1) notFound();
  // Page 1 lives at the collection's own URL.
  if (page === 1) redirect(`/${locale}/c/${collection}`);

  return <CollectionListing collection={collection} locale={locale} page={page} />;
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale, collection, pageNumber } = await paramsPromise;
  const originalCollectionName = getOriginalCollectionName(collection, locale);
  const capitalizedCollection =
    originalCollectionName.charAt(0).toUpperCase() + originalCollectionName.slice(1);

  const website = await getCurrentWebsite();

  return generateMeta({ doc: { title: `${capitalizedCollection} - ${pageNumber}` }, website });
}
