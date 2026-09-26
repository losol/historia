import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next/types';
import { generateMeta } from '@/lib/seo';
import { getCurrentWebsite } from '@/lib/website';
import { CollectionListing } from '../../CollectionListing';

type Args = {
  params: Promise<{
    locale: string;
    collection: string;
    pageNumber: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Readonly<Args>) {
  const { locale, collection, pageNumber } = await paramsPromise;
  // Digits only: Number() would also accept forms like `1e2` or `0x10`.
  if (!/^[1-9]\d*$/.test(pageNumber)) notFound();
  const page = Number(pageNumber);

  // Page 1 lives at the collection's own URL.
  if (page === 1) redirect(`/${locale}/c/${collection}`);

  return <CollectionListing collection={collection} locale={locale} page={page} />;
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { collection, pageNumber } = await paramsPromise;
  // The URL segment is the localized name (e.g. `people`, `artikler`), as in the page heading.
  const capitalizedCollection = collection.charAt(0).toUpperCase() + collection.slice(1);

  const website = await getCurrentWebsite();

  return generateMeta({ doc: { title: `${capitalizedCollection} - ${pageNumber}` }, website });
}
