'use client';
import type React from 'react';
import { Pagination as PaginationComponent } from '@eventuras/ratio-ui/core/Pagination';
import { useRouter } from 'next/navigation';
import { cn } from '@/utilities/cn';

export const Pagination: React.FC<{
  className?: string;
  page: number;
  totalPages: number;
}> = (props) => {
  const router = useRouter();

  const { className, page, totalPages } = props;

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent
        currentPage={page}
        totalPages={totalPages}
        onPreviousPageClick={() => {
          if (page > 1) router.push(`/articles/page/${page - 1}`);
        }}
        onNextPageClick={() => {
          if (page < totalPages) router.push(`/articles/page/${page + 1}`);
        }}
      />
    </div>
  );
};
