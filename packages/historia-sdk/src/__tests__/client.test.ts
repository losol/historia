import { describe, expect, it, vi } from 'vitest';
import { createHistoriaClient, formatPrice, HistoriaError } from '../index';

const BASE = 'https://shop.example.com';

const rawProduct = {
  id: 'p1',
  resourceId: 'n5rnun9',
  slug: 'bok-losene',
  title: 'Bok: Losene langs kysten',
  lead: 'Innbundet, 240 sider.',
  productType: 'physical',
  price: { amountExVat: 27920, vatAmount: 6980, amountIncVat: 34900, vatRate: 25, currency: 'NOK' },
  image: {
    media: {
      url: null,
      title: 'Morgen på fjorden',
      width: 1600,
      height: 900,
      sizes: {
        thumbnail: { url: '/api/media/file/morgen-400x400.png', width: 400, height: 400 },
        landscape: {
          url: 'https://cdn.example.com/morgen-1920x1080.png',
          width: 1920,
          height: 1080,
        },
        square: { url: null, width: null, height: null },
      },
    },
  },
  inventory: null,
  sku: null,
  updatedAt: '2026-09-27T21:04:07.167Z',
};

function fakeFetch(body: unknown, init: { status?: number } = {}) {
  return vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

const page = (docs: unknown[]) => ({
  docs,
  page: 1,
  totalPages: 3,
  totalDocs: 41,
  hasNextPage: true,
});

describe('products.list', () => {
  it('asks for published, non-shipping products with only the fields it returns', async () => {
    const fetch = fakeFetch(page([rawProduct]));
    const historia = createHistoriaClient({ baseUrl: `${BASE}/`, fetch });

    await historia.products.list({ limit: 6, page: 2, sort: '-price', productType: 'digital' });

    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe(`${BASE}/api/products`);
    const q = url.searchParams;
    expect(q.get('locale')).toBe('no');
    expect(q.get('depth')).toBe('1');
    expect(q.get('limit')).toBe('6');
    expect(q.get('page')).toBe('2');
    expect(q.get('sort')).toBe('-price.amountExVat');
    expect(q.get('where[and][0][productType][not_equals]')).toBe('shipping');
    expect(q.get('where[and][1][productType][in]')).toBe('digital');
    expect(q.get('select[price]')).toBe('true');
    expect(q.get('select[story]')).toBeNull();
    expect(q.get('populate[media][sizes]')).toBe('true');
  });

  it('maps products to the public shape', async () => {
    const historia = createHistoriaClient({ baseUrl: BASE, fetch: fakeFetch(page([rawProduct])) });

    const result = await historia.products.list();

    expect(result).toMatchObject({ page: 1, totalPages: 3, totalItems: 41, hasNextPage: true });
    const [product] = result.items;
    expect(product).toMatchObject({
      id: 'p1',
      title: 'Bok: Losene langs kysten',
      price: { amountIncVat: 34900, currency: 'NOK' },
      url: `${BASE}/no/c/produkter/bok-losene--n5rnun9`,
      inventory: null,
    });
    // No original URL: the largest size stands in. Relative URLs become absolute,
    // and sizes without a URL are left out.
    expect(product?.image).toEqual({
      url: 'https://cdn.example.com/morgen-1920x1080.png',
      width: 1920,
      height: 1080,
      alt: 'Morgen på fjorden',
      sizes: {
        thumbnail: { url: `${BASE}/api/media/file/morgen-400x400.png`, width: 400, height: 400 },
        landscape: {
          url: 'https://cdn.example.com/morgen-1920x1080.png',
          width: 1920,
          height: 1080,
        },
      },
    });
  });

  it('keeps the limit between 1 and 100', async () => {
    const fetch = fakeFetch(page([]));
    const historia = createHistoriaClient({ baseUrl: BASE, fetch });
    await historia.products.list({ limit: 500 });
    expect(new URL(String(fetch.mock.calls[0]?.[0])).searchParams.get('limit')).toBe('100');
  });

  it('builds English product URLs under /en/c/products', async () => {
    const historia = createHistoriaClient({
      baseUrl: BASE,
      locale: 'en',
      fetch: fakeFetch(page([rawProduct])),
    });
    const { items } = await historia.products.list();
    expect(items[0]?.url).toBe(`${BASE}/en/c/products/bok-losene--n5rnun9`);
  });
});

describe('products.get', () => {
  it('finds a product by slug', async () => {
    const fetch = fakeFetch(page([rawProduct]));
    const historia = createHistoriaClient({ baseUrl: BASE, fetch });

    const product = await historia.products.get('bok-losene');

    const q = new URL(String(fetch.mock.calls[0]?.[0])).searchParams;
    expect(q.get('where[and][1][slug][equals]')).toBe('bok-losene');
    expect(q.get('limit')).toBe('1');
    expect(product?.title).toBe('Bok: Losene langs kysten');
  });

  it('returns null when there is no such product', async () => {
    const historia = createHistoriaClient({ baseUrl: BASE, fetch: fakeFetch(page([])) });
    expect(await historia.products.get('missing')).toBeNull();
  });
});

describe('errors', () => {
  it('reports Historia error messages with the status', async () => {
    const historia = createHistoriaClient({
      baseUrl: BASE,
      fetch: fakeFetch({ errors: [{ message: 'Something went wrong' }] }, { status: 500 }),
    });
    const error = await historia.products.list().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HistoriaError);
    expect(error).toMatchObject({
      status: 500,
      message: 'Historia answered 500: Something went wrong',
    });
  });

  it('hints at the base URL when Historia refuses the domain', async () => {
    const historia = createHistoriaClient({
      baseUrl: BASE,
      fetch: fakeFetch(
        { errors: [{ message: 'You are not allowed to perform this action.' }] },
        { status: 403 },
      ),
    });
    await expect(historia.products.list()).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining(`is ${BASE} one of the website's domains`),
    });
  });

  it('reports network failures with status 0', async () => {
    const historia = createHistoriaClient({
      baseUrl: BASE,
      fetch: vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    });
    await expect(historia.products.list()).rejects.toMatchObject({ status: 0 });
  });

  it('gives up after the timeout', async () => {
    const hanging = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const historia = createHistoriaClient({ baseUrl: BASE, fetch: hanging, timeoutMs: 20 });
    await expect(historia.products.list()).rejects.toMatchObject({
      status: 0,
      message: 'Request to Historia timed out or was aborted',
    });
  });

  it('rejects a base URL that is not http(s)', () => {
    expect(() => createHistoriaClient({ baseUrl: 'shop.example.com' })).toThrow(TypeError);
  });
});

describe('formatPrice', () => {
  it('formats minor units as a localised price', () => {
    expect(formatPrice(34900, 'NOK')).toMatch(/349,00/);
    expect(formatPrice(1999, 'EUR', 'en-GB')).toBe('€19.99');
  });
});
