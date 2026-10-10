/**
 * @eventuras/historia-sdk: read Historia content from other sites.
 *
 * @example
 * import { createHistoriaClient, formatPrice } from '@eventuras/historia-sdk';
 *
 * const historia = createHistoriaClient({ baseUrl: 'https://butikk.losvik.no' });
 * const { items } = await historia.products.list({ limit: 6 });
 * for (const product of items) {
 *   console.log(product.title, product.price && formatPrice(product.price.amountIncVat, product.price.currency));
 * }
 */

export {
  createHistoriaClient,
  type HistoriaClient,
  type HistoriaClientOptions,
  type RequestOptions,
} from './client';
export { HistoriaError } from './errors';
export { formatPrice } from './format';
export {
  type ListProductsOptions,
  type ProductSort,
  type ProductsApi,
  productUrl,
} from './products';
export type {
  HistoriaImage,
  HistoriaImageSize,
  HistoriaPage,
  HistoriaPrice,
  HistoriaProduct,
  HistoriaProductType,
} from './types';
