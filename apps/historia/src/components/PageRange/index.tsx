import type React from 'react';

/** "Showing 1 - 20 of 25 articles", in the page's language. */
export const PageRange: React.FC<{
  className?: string;
  locale: string;
  /** What is counted, in the page's language and in plural (e.g. `artikler`). */
  label: string;
  currentPage?: number;
  limit: number;
  totalDocs: number;
}> = ({ className, locale, label, currentPage = 1, limit, totalDocs }) => {
  const indexStart = Math.min((currentPage - 1) * limit + 1, totalDocs);
  const indexEnd = Math.min(currentPage * limit, totalDocs);
  const range = indexStart === indexEnd ? `${indexStart}` : `${indexStart} - ${indexEnd}`;

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {locale === 'en'
        ? `Showing ${range} of ${totalDocs} ${label}`
        : `Viser ${range} av ${totalDocs} ${label}`}
    </div>
  );
};
