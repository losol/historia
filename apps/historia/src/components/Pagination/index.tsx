'use client';
import type React from 'react';
import { Pagination as PaginationComponent } from '@eventuras/ratio-ui/core/Pagination';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/utilities/cn';

export const Pagination: React.FC<{
  /** URL of the list's first page, e.g. `/no/c/artikler`. Later pages are `{basePath}/page/{n}`. */
  basePath: string;
  className?: string;
  page: number;
  totalPages: number;
}> = (props) => {
  const router = useRouter();
  const { locale } = useParams<{ locale?: string }>();
  const labels =
    locale === 'en'
      ? undefined
      : {
          previous: 'Forrige side',
          next: 'Neste side',
          status: (current: number, total: number) => `Side ${current} av ${total}`,
        };

  const { basePath, className, page, totalPages } = props;
  const pageUrl = (n: number) => (n === 1 ? basePath : `${basePath}/page/${n}`);

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent
        currentPage={page}
        totalPages={totalPages}
        aria-label={locale === 'en' ? 'Pagination' : 'Sidenavigasjon'}
        labels={labels}
        onPreviousPageClick={() => {
          if (page > 1) router.push(pageUrl(page - 1));
        }}
        onNextPageClick={() => {
          if (page < totalPages) router.push(pageUrl(page + 1));
        }}
      />
    </div>
  );
};
