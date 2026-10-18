import type { Requester, RequestOptions } from './client';
import { MEDIA_POPULATE, mapImage, type RawMedia } from './media';
import { documentUrl } from './paths';
import { type RawRichText, toPlainText, toRichText } from './richtext';
import type { HistoriaNote, HistoriaPage, HistoriaTopic } from './types';

export type NoteSort =
  | 'publishedAt'
  | '-publishedAt'
  | 'title'
  | '-title'
  | 'updatedAt'
  | '-updatedAt';

export interface ListNotesOptions extends RequestOptions {
  /** Notes per page, 1–100. Default: 20. */
  limit?: number;
  /** 1-based. Default: 1. */
  page?: number;
  /** Default: `-publishedAt`, the newest first. */
  sort?: NoteSort;
  /** Only notes about one of these topics, by the topic's slug. */
  topics?: string | string[];
  /** Only these notes, by id. */
  ids?: string[];
}

export interface NotesApi {
  /** The website's notes, one page at a time, the newest first. */
  list(options?: ListNotesOptions): Promise<HistoriaPage<HistoriaNote>>;
  /** One note by its slug in the client's locale, or null when there is none. */
  get(slug: string, options?: RequestOptions): Promise<HistoriaNote | null>;
  /** One note by id, or null when there is none. */
  getById(id: string, options?: RequestOptions): Promise<HistoriaNote | null>;
}

// What Historia's REST API returns for the fields the SDK asks for. Exported for the
// check in Historia (apps/historia/src/collections/notes-sdk-contract.ts) that these
// still match its schema; not part of the public API.
export interface RawTopic {
  id: string;
  title?: string | null;
  slug?: string | null;
}
export interface RawNote {
  id: string;
  resourceId?: string | null;
  slug?: string | null;
  title?: string | null;
  image?: { media?: RawMedia | string | null; caption?: RawRichText | null } | null;
  content?: RawRichText | null;
  topics?: (string | RawTopic)[] | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}
interface RawPage {
  docs: RawNote[];
  page?: number;
  totalPages?: number;
  totalDocs?: number;
  hasNextPage?: boolean;
}

// Only what the SDK returns: without a select, Historia also returns the related
// content, the SEO fields and the website the note belongs to.
export const NOTE_SELECT = {
  title: true,
  image: true,
  content: true,
  topics: true,
  publishedAt: true,
  slug: true,
  resourceId: true,
  updatedAt: true,
};
export const NOTE_POPULATE = {
  media: MEDIA_POPULATE,
  topics: { title: true, slug: true },
  // What a note's links can go to (Historia's LinkFeature): enough for their address.
  articles: { slug: true, resourceId: true },
  cases: { slug: true, resourceId: true },
  notes: { slug: true, resourceId: true },
  pages: { slug: true },
};

export function createNotesApi(context: {
  request: Requester;
  baseUrl: string;
  locale: string;
}): NotesApi {
  const { request, baseUrl, locale } = context;

  const query = (where: Record<string, unknown>, extra: Record<string, unknown>) => ({
    locale,
    depth: 1,
    where,
    select: NOTE_SELECT,
    populate: NOTE_POPULATE,
    ...extra,
  });

  const toNote = (raw: RawNote) => mapNote(raw, baseUrl, locale);

  const findOne = async (where: Record<string, unknown>, options?: RequestOptions) => {
    const page = await request<RawPage>('/api/notes', query(where, { limit: 1 }) as never, options);
    const raw = page.docs[0];
    return raw ? toNote(raw) : null;
  };

  return {
    async list(options = {}) {
      const limit = Math.min(Math.max(Math.trunc(options.limit ?? 20), 1), 100);
      const topics = options.topics ? [options.topics].flat() : undefined;
      const where: Record<string, unknown> = {
        ...(topics && { 'topics.slug': { in: topics } }),
        ...(options.ids && { id: { in: options.ids } }),
      };
      const page = await request<RawPage>(
        '/api/notes',
        query(where, {
          limit,
          page: Math.max(Math.trunc(options.page ?? 1), 1),
          sort: options.sort ?? '-publishedAt',
        }) as never,
        options,
      );
      return {
        items: page.docs.map(toNote),
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

function mapTopics(topics: RawNote['topics']): HistoriaTopic[] {
  // An id alone means the topic was not populated or not readable.
  return (topics ?? []).flatMap((topic) =>
    typeof topic === 'object' && topic !== null && topic.slug
      ? [{ id: topic.id, title: topic.title || topic.slug, slug: topic.slug }]
      : [],
  );
}

function mapNote(raw: RawNote, baseUrl: string, locale: string): HistoriaNote {
  const slug = raw.slug ?? '';
  const resourceId = raw.resourceId ?? raw.id;
  const context = { baseUrl, locale };
  const caption = toPlainText(toRichText(raw.image?.caption, context)).trim();
  return {
    id: raw.id,
    resourceId,
    slug,
    title: raw.title ?? '',
    image: mapImage(raw.image?.media, baseUrl),
    imageCaption: caption || null,
    content: toRichText(raw.content, context),
    topics: mapTopics(raw.topics),
    publishedAt: raw.publishedAt ?? null,
    url: documentUrl('notes', { slug, resourceId }, baseUrl, locale) ?? `${baseUrl}/${locale}`,
    updatedAt: raw.updatedAt ?? '',
  };
}
