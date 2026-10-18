/**
 * @eventuras/historia-sdk: read Historia content from other sites.
 *
 * @example
 * import { createHistoriaClient, formatPrice, toPlainText } from '@eventuras/historia-sdk';
 *
 * const historia = createHistoriaClient({ baseUrl: 'https://shop.example.com' });
 * const { items } = await historia.products.list({ limit: 6 });
 * for (const product of items) {
 *   console.log(product.title, product.price && formatPrice(product.price.amountIncVat, product.price.currency));
 * }
 *
 * const notes = await historia.notes.list({ limit: 5 });
 * for (const note of notes.items) console.log(note.title, toPlainText(note.content));
 */

export {
  createHistoriaClient,
  type HistoriaClient,
  type HistoriaClientOptions,
  type RequestOptions,
} from './client';
export { HistoriaError } from './errors';
export { formatPrice } from './format';
export type { ListNotesOptions, NoteSort, NotesApi } from './notes';
export {
  type ListProductsOptions,
  type ProductSort,
  type ProductsApi,
  productUrl,
} from './products';
export { toPlainText } from './richtext';
export type {
  HistoriaBlock,
  HistoriaDocumentRef,
  HistoriaImage,
  HistoriaImageSize,
  HistoriaInline,
  HistoriaLineBreak,
  HistoriaLink,
  HistoriaMark,
  HistoriaNote,
  HistoriaPage,
  HistoriaPrice,
  HistoriaProduct,
  HistoriaProductType,
  HistoriaRichText,
  HistoriaText,
  HistoriaTopic,
} from './types';
