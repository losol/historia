import { beforeEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const { revalidateSitemap, revalidateSitemapAfterDelete } = await import('./revalidateSitemap');

type Doc = { _status?: string | null } & Record<string, unknown>;

const change = (
  slug: string,
  operation: 'create' | 'update',
  doc: Doc,
  previousDoc: Doc = {},
  context: Record<string, unknown> = {},
) =>
  // biome-ignore lint/suspicious/noExplicitAny: only the fields the hook reads are faked
  revalidateSitemap({ doc, previousDoc, operation, collection: { slug }, req: { context } } as any);

const tags = () => revalidateTag.mock.calls.map(([tag]) => tag);

beforeEach(() => revalidateTag.mockClear());

describe('revalidateSitemap', () => {
  // Payload creates the autosave draft while it renders the admin's create view,
  // and Next refuses revalidateTag during render: the view came up without a form.
  it('leaves the caches alone when a draft is created', () => {
    change('articles', 'create', { _status: 'draft' });
    change('pages', 'create', { _status: 'draft' });
    expect(tags()).toEqual([]);
  });

  it('expires them when a document is created published', () => {
    change('articles', 'create', { _status: 'published' });
    expect(tags()).toEqual(['articles-sitemap', 'collections-sitemap']);
  });

  it('expires them when a collection without drafts gets a document', () => {
    change('persons', 'create', { name: 'Kari' });
    expect(tags()).toEqual(['collections-sitemap']);
  });

  it('leaves them alone while a draft is edited', () => {
    change('pages', 'update', { _status: 'draft' }, { _status: 'draft' });
    expect(tags()).toEqual([]);
  });

  it('expires them when a document is published, changed while published, or unpublished', () => {
    change('pages', 'update', { _status: 'published' }, { _status: 'draft' });
    change('pages', 'update', { _status: 'published' }, { _status: 'published' });
    change('pages', 'update', { _status: 'draft' }, { _status: 'published' });
    expect(tags()).toEqual(['pages-sitemap', 'pages-sitemap', 'pages-sitemap']);
  });

  it('can be turned off through the request context', () => {
    change('articles', 'update', { _status: 'published' }, {}, { disableRevalidate: true });
    expect(tags()).toEqual([]);
  });

  it('drops the entry at once rather than serving it stale once more', () => {
    change('cases', 'update', { _status: 'published' }, { _status: 'published' });
    expect(revalidateTag).toHaveBeenCalledWith('collections-sitemap', { expire: 0 });
  });
});

describe('revalidateSitemapAfterDelete', () => {
  it('expires the caches of the collection', () => {
    // biome-ignore lint/suspicious/noExplicitAny: only the fields the hook reads are faked
    const args = { doc: {}, collection: { slug: 'pages' }, req: { context: {} } } as any;
    revalidateSitemapAfterDelete(args);
    expect(tags()).toEqual(['pages-sitemap']);
  });
});
