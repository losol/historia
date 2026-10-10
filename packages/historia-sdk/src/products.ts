import type { Requester, RequestOptions } from './client';
import type {
  HistoriaImage,
  HistoriaImageSize,
  HistoriaPage,
  HistoriaPrice,
  HistoriaProduct,
  HistoriaProductType,
} from './types';

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
}

// What Historia's REST API returns for the fields the SDK asks for.
interface RawSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}
interface RawMedia extends RawSize {
  title?: string | null;
  sizes?: Record<string, RawSize | null> | null;
}
interface RawProduct {
  id: string;
  resourceId?: string | null;
  slug?: string | null;
  title?: string | null;
  lead?: string | null;
  productType?: string | null;
  price?: Partial<HistoriaPrice> | null;
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
const SELECT = {
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
const POPULATE = {
  media: { url: true, title: true, width: true, height: true, sizes: true },
};

// The shop's product pages live under a localised segment (see Historia's
// pageCollections): /no/c/produkter/..., /en/c/products/...
const PRODUCT_SEGMENT: Record<string, string> = { no: 'produkter', en: 'products' };

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
  };
}

function absolute(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, `${baseUrl}/`).toString();
  } catch {
    return null;
  }
}

function mapImage(media: RawMedia | string | null | undefined, baseUrl: string) {
  // An id instead of a document means the media was not populated or not readable.
  if (!media || typeof media === 'string') return null;

  const sizes: Record<string, HistoriaImageSize> = {};
  for (const [name, size] of Object.entries(media.sizes ?? {})) {
    const url = absolute(size?.url, baseUrl);
    if (url) sizes[name] = { url, width: size?.width ?? null, height: size?.height ?? null };
  }
  const largest = Object.values(sizes).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  const url = absolute(media.url, baseUrl) ?? largest?.url;
  if (!url) return null;

  const image: HistoriaImage = {
    url,
    width: media.url ? (media.width ?? null) : (largest?.width ?? null),
    height: media.url ? (media.height ?? null) : (largest?.height ?? null),
    alt: media.title ?? null,
    sizes,
  };
  return image;
}

function mapPrice(price: Partial<HistoriaPrice> | null | undefined): HistoriaPrice | null {
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
  const segment = PRODUCT_SEGMENT[locale] ?? 'products';
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
