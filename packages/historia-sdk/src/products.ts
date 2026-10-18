import type { Requester, RequestOptions } from './client';
import { MEDIA_POPULATE, mapImage, type RawMedia } from './media';
import { collectionSegment } from './paths';
import type { HistoriaPage, HistoriaPrice, HistoriaProduct, HistoriaProductType } from './types';

export type { RawMedia, RawSize } from './media';

export type ProductSort =
  | 'title'
  | '-title'
  | 'price'
  | '-price'
  | 'createdAt'
  | '-createdAt'
  | 'updatedAt'
  | '-updatedAt';

export interface ListProductsOptions extends RequestOptions {
  /** Products per page, 1–100. Default: 20. */
  limit?: number;
  /** 1-based. Default: 1. */
  page?: number;
  /** Default: `title`. */
  sort?: ProductSort;
  /** Only products of these types. */
  productType?: HistoriaProductType | HistoriaProductType[];
  /** Only these products, by id. */
  ids?: string[];
}

export interface ProductsApi {
  /** Published products of the website, one page at a time. */
  list(options?: ListProductsOptions): Promise<HistoriaPage<HistoriaProduct>>;
  /** One product by its slug in the client's locale, or null when there is none. */
  get(slug: string, options?: RequestOptions): Promise<HistoriaProduct | null>;
  /** One product by id, or null when there is none. */
  getById(id: string, options?: RequestOptions): Promise<HistoriaProduct | null>;
  /**
   * One product by its short id, the one in its URL after the slug (`…--x7k2p9a`), or null. It
   * never changes, so a link made with it holds when the slug does.
   */
  getByResourceId(resourceId: string, options?: RequestOptions): Promise<HistoriaProduct | null>;
}

// What Historia's REST API returns for the fields the SDK asks for. Exported for the
// check in Historia (apps/historia/src/collections/Products/sdk-contract.ts) that
// these still match its schema; not part of the public API.
export interface RawPrice {
  amountExVat?: number | null;
  vatAmount?: number | null;
  amountIncVat?: number | null;
  vatRate?: number | null;
  currency?: string | null;
}
export interface RawProduct {
  id: string;
  resourceId?: string | null;
  slug?: string | null;
  title?: string | null;
  lead?: string | null;
  productType?: string | null;
  price?: RawPrice | null;
  image?: { media?: RawMedia | string | null } | null;
  inventory?: number | null;
  sku?: string | null;
  updatedAt?: string | null;
}
interface RawPage {
  docs: RawProduct[];
  page?: number;
  totalPages?: number;
  totalDocs?: number;
  hasNextPage?: boolean;
}

// Only what the SDK returns, so the answer stays small: without a select, Historia
// also returns the story, the gallery and the whole website the product belongs to.
export const SELECT = {
  title: true,
  lead: true,
  productType: true,
  price: true,
  image: true,
  inventory: true,
  sku: true,
  slug: true,
  resourceId: true,
  updatedAt: true,
};
export const POPULATE = { media: MEDIA_POPULATE };

const SORT_FIELD: Record<ProductSort, string> = {
  title: 'title',
  '-title': '-title',
  price: 'price.amountExVat',
  '-price': '-price.amountExVat',
  createdAt: 'createdAt',
  '-createdAt': '-createdAt',
  updatedAt: 'updatedAt',
  '-updatedAt': '-updatedAt',
};

export function createProductsApi(context: {
  request: Requester;
  baseUrl: string;
  locale: string;
}): ProductsApi {
  const { request, baseUrl, locale } = context;

  const query = (where: Record<string, unknown>, extra: Record<string, unknown>) => ({
    locale,
    depth: 1,
    // Shipping lines are priced by Vipps at checkout, not sold on their own.
    where: { and: [{ productType: { not_equals: 'shipping' } }, where] },
    select: SELECT,
    populate: POPULATE,
    ...extra,
  });

  const toProduct = (raw: RawProduct) => mapProduct(raw, baseUrl, locale);

  const findOne = async (where: Record<string, unknown>, options?: RequestOptions) => {
    const page = await request<RawPage>(
      '/api/products',
      query(where, { limit: 1 }) as never,
      options,
    );
    const raw = page.docs[0];
    return raw ? toProduct(raw) : null;
  };

  return {
    async list(options = {}) {
      const limit = Math.min(Math.max(Math.trunc(options.limit ?? 20), 1), 100);
      const types = options.productType ? [options.productType].flat() : undefined;
      const where: Record<string, unknown> = {
        ...(types && { productType: { in: types } }),
        ...(options.ids && { id: { in: options.ids } }),
      };
      const page = await request<RawPage>(
        '/api/products',
        query(where, {
          limit,
          page: Math.max(Math.trunc(options.page ?? 1), 1),
          sort: SORT_FIELD[options.sort ?? 'title'],
        }) as never,
        options,
      );
      return {
        items: page.docs.map(toProduct),
        page: page.page ?? 1,
        totalPages: page.totalPages ?? 1,
        totalItems: page.totalDocs ?? page.docs.length,
        hasNextPage: page.hasNextPage ?? false,
      };
    },

    get(slug, options) {
      return findOne({ slug: { equals: slug } }, options);
    },

    getById(id, options) {
      return findOne({ id: { equals: id } }, options);
    },

    getByResourceId(resourceId, options) {
      return findOne({ resourceId: { equals: resourceId } }, options);
    },
  };
}

function mapPrice(price: RawPrice | null | undefined): HistoriaPrice | null {
  if (!price || typeof price.amountExVat !== 'number') return null;
  return {
    amountExVat: price.amountExVat,
    vatAmount: price.vatAmount ?? 0,
    amountIncVat: price.amountIncVat ?? price.amountExVat,
    vatRate: price.vatRate ?? 0,
    currency: price.currency ?? 'NOK',
  };
}

export function productUrl(
  product: { slug: string; resourceId: string },
  baseUrl: string,
  locale: string,
): string {
  // The shop's product pages: /no/c/produkter/..., /en/c/products/...
  const segment = collectionSegment('products', locale) ?? 'products';
  return `${baseUrl}/${locale}/c/${segment}/${product.slug}--${product.resourceId}`;
}

function mapProduct(raw: RawProduct, baseUrl: string, locale: string): HistoriaProduct {
  const slug = raw.slug ?? '';
  const resourceId = raw.resourceId ?? raw.id;
  return {
    id: raw.id,
    resourceId,
    slug,
    title: raw.title ?? '',
    lead: raw.lead ?? null,
    productType: (raw.productType ?? 'physical') as HistoriaProductType,
    price: mapPrice(raw.price),
    image: mapImage(raw.image?.media, baseUrl),
    inventory: raw.inventory ?? null,
    sku: raw.sku ?? null,
    url: productUrl({ slug, resourceId }, baseUrl, locale),
    updatedAt: raw.updatedAt ?? '',
  };
}
