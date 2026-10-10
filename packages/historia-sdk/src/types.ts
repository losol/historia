/**
 * The public shape of Historia content as the SDK returns it. These are kept small
 * and stable on purpose: they are not Historia's internal Payload types, so the CMS
 * can change without breaking sites that use the SDK.
 */

/** Amounts are in minor units (øre, cents), as Historia stores them. */
export interface HistoriaPrice {
  amountExVat: number;
  vatAmount: number;
  amountIncVat: number;
  /** Percent, e.g. 25. */
  vatRate: number;
  /** ISO 4217, e.g. NOK. */
  currency: string;
}

export interface HistoriaImageSize {
  url: string;
  width: number | null;
  height: number | null;
}

export interface HistoriaImage {
  /** The best available URL: the original, or else the largest generated size. */
  url: string;
  width: number | null;
  height: number | null;
  /** The media title, the closest Historia has to alt text. */
  alt: string | null;
  /** Generated sizes by name: thumbnail, square, landscape, socialShare, ... */
  sizes: Record<string, HistoriaImageSize>;
}

export type HistoriaProductType = 'physical' | 'digital' | 'service';

export interface HistoriaProduct {
  id: string;
  /** Short, stable id used in the product's URL. */
  resourceId: string;
  slug: string;
  title: string;
  lead: string | null;
  productType: HistoriaProductType;
  /** Null when the product has no price set. */
  price: HistoriaPrice | null;
  image: HistoriaImage | null;
  /** Units in stock; null means unlimited. */
  inventory: number | null;
  sku: string | null;
  /** The product's page in the Historia shop, where it can be bought. */
  url: string;
  updatedAt: string;
}

export interface HistoriaPage<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
}
