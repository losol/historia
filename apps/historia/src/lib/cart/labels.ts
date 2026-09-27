import type { CartLineItemLabels } from '@eventuras/ratio-ui/commerce/CartLineItem';
import type { OrderSummaryLabels } from '@eventuras/ratio-ui/commerce/OrderSummary';

// The ratio-ui cart components fall back to English; the shop is Norwegian first.

const lineItem: Record<'no' | 'en', CartLineItemLabels> = {
  no: {
    vatAmount: (vat) => `inkl. mva ${vat}`,
    totalIncludesVat: 'inkl. mva',
    quantity: 'Antall',
    decreaseQuantity: 'Fjern en',
    increaseQuantity: 'Legg til en',
    remove: 'Fjern',
  },
  en: {},
};

const orderSummary: Record<'no' | 'en', OrderSummaryLabels & { title: string }> = {
  no: {
    subtotalExVat: 'Sum (eks. mva)',
    vat: 'Mva',
    total: 'Totalt',
    title: 'Ordresammendrag',
  },
  en: { title: 'Order summary' },
};

export function cartLineItemLabels(locale: string): CartLineItemLabels {
  return locale === 'en' ? lineItem.en : lineItem.no;
}

export function orderSummaryLabels(locale: string) {
  const { title, ...labels } = locale === 'en' ? orderSummary.en : orderSummary.no;
  return { title, labels };
}
