import type { Contributors } from '@/payload-types';

const BY: Record<string, string> = { no: 'Av', en: 'By' };
const intlLocale = (locale: string) => (locale === 'no' ? 'nb' : locale);

/** "Av Kari Nordmann og Ola Nordmann", from contributors whose person is populated. */
export function Byline({
  contributors,
  locale,
}: {
  contributors?: Contributors | null;
  locale: string;
}) {
  const names = (contributors ?? [])
    .map((c) => (typeof c.person === 'object' && c.person ? c.person.name : null))
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return null;

  const list = new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(names);
  return (
    <p className="text-sm text-muted-foreground">
      {BY[locale] ?? BY.en} {list}
    </p>
  );
}
