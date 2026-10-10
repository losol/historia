/**
 * An amount in minor units as a localised price, e.g. 34900 NOK → "kr 349,00".
 * Uses Intl, so it works in browsers, Node and edge runtimes alike.
 */
export function formatPrice(amountMinor: number, currency: string, locale = 'nb-NO'): string {
  const fractionDigits =
    new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    amountMinor / 10 ** fractionDigits,
  );
}
