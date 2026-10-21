import type React from 'react';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import type { Article, Page } from '@/payload-types';
import { getCachedDocument } from '@/utilities/getDocument';
import { getCachedRedirects } from '@/utilities/getRedirects';

interface Props {
  disableNotFound?: boolean;
  /** 308 instead of 307, for URLs that moved for good (e.g. a migrated site). */
  permanent?: boolean;
  url: string;
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, permanent, url }) => {
  const goTo = permanent ? permanentRedirect : redirect;
  const redirects = await getCachedRedirects()();

  const redirectItem = redirects.find((redirect) => redirect.from === url);

  if (redirectItem) {
    if (redirectItem.to?.url) {
      goTo(redirectItem.to.url);
    }

    let redirectUrl: string;

    if (typeof redirectItem.to?.reference?.value === 'string') {
      const collection = redirectItem.to?.reference?.relationTo;
      const id = redirectItem.to?.reference?.value;

      const document = (await getCachedDocument(collection, id)()) as Article | Page;
      const collectionPrefix =
        redirectItem.to?.reference?.relationTo !== 'pages'
          ? `/${redirectItem.to?.reference?.relationTo}`
          : '';
      redirectUrl = `${collectionPrefix}/${document?.slug}`;
    } else {
      const collectionPrefix =
        redirectItem.to?.reference?.relationTo !== 'pages'
          ? `/${redirectItem.to?.reference?.relationTo}`
          : '';
      redirectUrl = `${collectionPrefix}/${
        typeof redirectItem.to?.reference?.value === 'object'
          ? redirectItem.to?.reference?.value?.slug
          : ''
      }`;
    }

    if (redirectUrl) goTo(redirectUrl);
  }

  if (disableNotFound) return null;

  notFound();
};
