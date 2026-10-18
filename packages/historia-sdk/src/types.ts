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

/**
 * Rich text as the SDK hands it on: a few kinds of block, each with its text, and
 * nothing of the editor Historia stores it from. A site draws it however it likes.
 * What the SDK doesn't know is kept as its text, never dropped.
 */
export type HistoriaRichText = HistoriaBlock[];

export type HistoriaBlock =
  | { type: 'paragraph'; children: HistoriaInline[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: HistoriaInline[] }
  | { type: 'quote'; children: HistoriaInline[] }
  /** Each item its text. A list in a list is flattened into it. */
  | { type: 'list'; ordered: boolean; items: HistoriaInline[][] };

export type HistoriaInline = HistoriaText | HistoriaLink | HistoriaLineBreak;

export type HistoriaMark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';

export interface HistoriaText {
  type: 'text';
  text: string;
  marks: HistoriaMark[];
}

export interface HistoriaLineBreak {
  type: 'linebreak';
}

export interface HistoriaLink {
  type: 'link';
  /** Absolute, and only http(s), mailto or tel: a link to anything else is left as its text. */
  url: string;
  newTab: boolean;
  /** For a link to another document in Historia: which, so a site can show it itself. */
  document: HistoriaDocumentRef | null;
  children: (HistoriaText | HistoriaLineBreak)[];
}

export interface HistoriaDocumentRef {
  /** Historia's collection, e.g. `notes`, `articles`, `pages`. */
  collection: string;
  slug: string;
  resourceId: string | null;
}

export interface HistoriaTopic {
  id: string;
  title: string;
  slug: string;
}

export interface HistoriaNote {
  id: string;
  /** Short, stable id used in the note's URL. */
  resourceId: string;
  slug: string;
  title: string;
  image: HistoriaImage | null;
  /** The picture's caption, as plain text. */
  imageCaption: string | null;
  /** Empty when the note has no text. */
  content: HistoriaRichText;
  topics: HistoriaTopic[];
  /** ISO date; null when not set. */
  publishedAt: string | null;
  /** The note's page on the Historia website. */
  url: string;
  updatedAt: string;
}
