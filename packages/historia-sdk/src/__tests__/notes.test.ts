import { describe, expect, it, vi } from 'vitest';
import { createHistoriaClient } from '../index';

const BASE = 'https://losvik.example.com';

const rawNote = {
  id: 'n1',
  resourceId: 'x7k2p',
  slug: 'dugnad-pa-kaia',
  title: 'Dugnad på kaia',
  image: {
    media: {
      url: '/api/media/file/kaia.jpg',
      title: 'Kaia i Losvik',
      width: 1600,
      height: 1200,
      sizes: { thumbnail: { url: '/api/media/file/kaia-400x400.jpg', width: 400, height: 400 } },
    },
    caption: {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'Kaia i fjor.', format: 0 }] },
        ],
      },
    },
  },
  content: {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Lørdag kl. 10. ', format: 0 },
            { type: 'text', text: 'Ta med kaffe.', format: 1 },
          ],
        },
      ],
    },
  },
  topics: [
    { id: 't1', title: 'Gjerøy', slug: 'gjeroy' },
    't2',
    { id: 't3', title: '', slug: 'kaia' },
  ],
  publishedAt: '2026-10-17T08:00:00.000Z',
  updatedAt: '2026-10-17T09:12:00.000Z',
};

function fakeFetch(body: unknown) {
  return vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

const page = (docs: unknown[]) => ({
  docs,
  page: 1,
  totalPages: 2,
  totalDocs: 7,
  hasNextPage: true,
});

describe('notes.list', () => {
  it('asks for the newest notes with only the fields it returns', async () => {
    const fetch = fakeFetch(page([rawNote]));
    const historia = createHistoriaClient({ baseUrl: BASE, fetch });

    await historia.notes.list({ limit: 5, topics: ['gjeroy', 'kaia'] });

    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe(`${BASE}/api/notes`);
    const q = url.searchParams;
    expect(q.get('locale')).toBe('no');
    expect(q.get('depth')).toBe('1');
    expect(q.get('limit')).toBe('5');
    expect(q.get('page')).toBe('1');
    expect(q.get('sort')).toBe('-publishedAt');
    expect(q.get('where[topics.slug][in]')).toBe('gjeroy,kaia');
    expect(q.get('select[content]')).toBe('true');
    expect(q.get('select[relatedContent]')).toBeNull();
    expect(q.get('populate[topics][slug]')).toBe('true');
    expect(q.get('populate[notes][resourceId]')).toBe('true');
    expect(q.get('populate[media][sizes]')).toBe('true');
  });

  it('maps notes to the public shape', async () => {
    const historia = createHistoriaClient({ baseUrl: BASE, fetch: fakeFetch(page([rawNote])) });

    const result = await historia.notes.list();

    expect(result).toMatchObject({ page: 1, totalPages: 2, totalItems: 7, hasNextPage: true });
    expect(result.items).toEqual([
      {
        id: 'n1',
        resourceId: 'x7k2p',
        slug: 'dugnad-pa-kaia',
        title: 'Dugnad på kaia',
        image: {
          url: `${BASE}/api/media/file/kaia.jpg`,
          width: 1600,
          height: 1200,
          alt: 'Kaia i Losvik',
          sizes: {
            thumbnail: { url: `${BASE}/api/media/file/kaia-400x400.jpg`, width: 400, height: 400 },
          },
        },
        imageCaption: 'Kaia i fjor.',
        content: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Lørdag kl. 10. ', marks: [] },
              { type: 'text', text: 'Ta med kaffe.', marks: ['bold'] },
            ],
          },
        ],
        // A topic not populated is left out; one without a title is called by its slug.
        topics: [
          { id: 't1', title: 'Gjerøy', slug: 'gjeroy' },
          { id: 't3', title: 'kaia', slug: 'kaia' },
        ],
        publishedAt: '2026-10-17T08:00:00.000Z',
        url: `${BASE}/no/c/notert/dugnad-pa-kaia--x7k2p`,
        updatedAt: '2026-10-17T09:12:00.000Z',
      },
    ]);
  });

  it('fills in what a sparse note lacks', async () => {
    const historia = createHistoriaClient({
      baseUrl: BASE,
      locale: 'en',
      fetch: fakeFetch({ docs: [{ id: 'n9', slug: 'ferry', resourceId: 'q1' }] }),
    });

    const { items, totalItems } = await historia.notes.list({ sort: 'title' });

    expect(totalItems).toBe(1);
    expect(items[0]).toEqual({
      id: 'n9',
      resourceId: 'q1',
      slug: 'ferry',
      title: '',
      image: null,
      imageCaption: null,
      content: [],
      topics: [],
      publishedAt: null,
      url: `${BASE}/en/c/notes/ferry--q1`,
      updatedAt: '',
    });
  });
});

describe('notes.get', () => {
  it('finds one note by slug, or null', async () => {
    const fetch = fakeFetch(page([rawNote]));
    const historia = createHistoriaClient({ baseUrl: BASE, fetch });

    expect((await historia.notes.get('dugnad-pa-kaia'))?.title).toBe('Dugnad på kaia');
    const q = new URL(String(fetch.mock.calls[0]?.[0])).searchParams;
    expect(q.get('where[slug][equals]')).toBe('dugnad-pa-kaia');
    expect(q.get('limit')).toBe('1');

    const none = createHistoriaClient({ baseUrl: BASE, fetch: fakeFetch(page([])) });
    expect(await none.notes.getById('nope')).toBeNull();
  });
});
