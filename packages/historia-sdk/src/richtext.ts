import { absolute } from './media';
import { documentUrl } from './paths';
import type {
  HistoriaBlock,
  HistoriaDocumentRef,
  HistoriaInline,
  HistoriaMark,
  HistoriaRichText,
} from './types';

// Historia's rich text is stored as the editor's (Lexical's) own tree. This turns it
// into the SDK's small one (types.ts), so a site never depends on the editor: what
// the SDK knows becomes its block or mark, what it doesn't is kept as its text.

/** A node of Lexical's tree, as Historia's REST API returns it. */
export interface RawLexicalNode {
  type?: string;
  children?: RawLexicalNode[] | null;
  text?: string | null;
  /** On text, the marks as bits; on blocks, the alignment. */
  format?: number | string | null;
  /** On headings, `h1`–`h6`; on lists, `ul` or `ol`. */
  tag?: string | null;
  /** On lists: `bullet`, `number` or `check`. */
  listType?: string | null;
  /** On links. */
  fields?: {
    linkType?: string | null;
    url?: string | null;
    newTab?: boolean | null;
    doc?: { relationTo?: string | null; value?: unknown } | null;
  } | null;
}

export interface RawRichText {
  root?: RawLexicalNode | null;
}

/** Lexical's bits for the marks on a piece of text. */
const MARK_BITS: ReadonlyArray<[HistoriaMark, number]> = [
  ['bold', 1],
  ['italic', 2],
  ['strikethrough', 4],
  ['underline', 8],
  ['code', 16],
];

/** Schemes a link may have: anything else (`javascript:`, `data:`) is left as text. */
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'quote', 'list']);

interface Context {
  baseUrl: string;
  locale: string;
}

/** Rich text from Historia in the SDK's shape; empty for none. */
export function toRichText(
  raw: RawRichText | null | undefined,
  context: Context,
): HistoriaRichText {
  return blocks(raw?.root?.children ?? [], context);
}

function blocks(nodes: readonly RawLexicalNode[], context: Context): HistoriaBlock[] {
  const out: HistoriaBlock[] = [];
  // Inline nodes found between blocks, kept together as one paragraph.
  let loose: HistoriaInline[] = [];
  const flush = () => {
    if (hasText(loose)) out.push({ type: 'paragraph', children: trimBreaks(loose) });
    loose = [];
  };

  for (const node of nodes) {
    const block = toBlock(node, context);
    if (block === 'inline') {
      loose.push(...inline([node], context));
      continue;
    }
    flush();
    if (Array.isArray(block)) out.push(...block);
    else if (block) out.push(block);
  }
  flush();
  return out;
}

/** A node as blocks; null when it has nothing to show; 'inline' when it's text, not a block. */
function toBlock(
  node: RawLexicalNode,
  context: Context,
): HistoriaBlock | HistoriaBlock[] | null | 'inline' {
  const children = node.children ?? [];
  switch (node.type) {
    case 'paragraph': {
      const content = trimBreaks(inline(children, context));
      return hasText(content) ? { type: 'paragraph', children: content } : null;
    }
    case 'heading': {
      const content = trimBreaks(inline(children, context));
      return hasText(content)
        ? { type: 'heading', level: headingLevel(node.tag), children: content }
        : null;
    }
    case 'quote': {
      const content = trimBreaks(inline(children, context));
      return hasText(content) ? { type: 'quote', children: content } : null;
    }
    case 'list': {
      const items = listItems(node, context);
      if (items.length === 0) return null;
      return { type: 'list', ordered: node.listType === 'number' || node.tag === 'ol', items };
    }
    default:
      // Something the SDK doesn't know: blocks inside it are its blocks; else it's text.
      if (children.some((child) => BLOCK_TYPES.has(child.type ?? '')))
        return blocks(children, context);
      return 'inline';
  }
}

function headingLevel(tag: string | null | undefined): 1 | 2 | 3 | 4 | 5 | 6 {
  const level = Number(tag?.replace(/^h/, ''));
  return level >= 1 && level <= 6 ? (level as 1 | 2 | 3 | 4 | 5 | 6) : 2;
}

/** A list's items, each its text; a list inside an item adds its items after it. */
function listItems(list: RawLexicalNode, context: Context): HistoriaInline[][] {
  const items: HistoriaInline[][] = [];
  for (const item of list.children ?? []) {
    const own = (item.children ?? []).filter((child) => child.type !== 'list');
    const content = trimBreaks(inline(own, context));
    if (hasText(content)) items.push(content);
    for (const nested of (item.children ?? []).filter((child) => child.type === 'list')) {
      items.push(...listItems(nested, context));
    }
  }
  return items;
}

function inline(nodes: readonly RawLexicalNode[], context: Context): HistoriaInline[] {
  const out: HistoriaInline[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        if (node.text) out.push({ type: 'text', text: node.text, marks: marks(node.format) });
        break;
      case 'tab':
        out.push({ type: 'text', text: '\t', marks: [] });
        break;
      case 'linebreak':
        out.push({ type: 'linebreak' });
        break;
      case 'link':
      case 'autolink': {
        const content = inline(node.children ?? [], context).flatMap((child) =>
          child.type === 'link' ? child.children : [child],
        );
        const target = linkTarget(node, context);
        // Without somewhere safe to go, a link is its text, as Historia shows it.
        if (target && hasText(content)) {
          out.push({
            type: 'link',
            url: target.url,
            newTab: node.fields?.newTab === true,
            document: target.document,
            children: content,
          });
        } else {
          out.push(...content);
        }
        break;
      }
      default:
        // Something the SDK doesn't know: its text, if it has any.
        if (node.children) out.push(...inline(node.children, context));
        else if (node.text) out.push({ type: 'text', text: node.text, marks: marks(node.format) });
    }
  }
  return out;
}

function marks(format: number | string | null | undefined): HistoriaMark[] {
  const bits = typeof format === 'number' ? format : 0;
  return MARK_BITS.filter(([, bit]) => (bits & bit) !== 0).map(([mark]) => mark);
}

/** Where a link goes: a URL given, or the page of a document in Historia. */
function linkTarget(
  node: RawLexicalNode,
  context: Context,
): { url: string; document: HistoriaDocumentRef | null } | null {
  const fields = node.fields ?? {};
  if (fields.linkType === 'internal') {
    const document = documentRef(fields.doc);
    if (!document) return null;
    const url = documentUrl(document.collection, document, context.baseUrl, context.locale);
    return url ? { url, document } : null;
  }
  const url = safeUrl(fields.url, context.baseUrl);
  return url ? { url, document: null } : null;
}

/** The linked document, when Historia populated it (an id alone says too little). */
function documentRef(
  doc: { relationTo?: string | null; value?: unknown } | null | undefined,
): HistoriaDocumentRef | null {
  const value = doc?.value;
  if (!doc?.relationTo || typeof value !== 'object' || value === null) return null;
  const { slug, resourceId } = value as { slug?: unknown; resourceId?: unknown };
  if (typeof slug !== 'string' || !slug) return null;
  return {
    collection: doc.relationTo,
    slug,
    resourceId: typeof resourceId === 'string' && resourceId ? resourceId : null,
  };
}

function safeUrl(url: string | null | undefined, baseUrl: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  const full = absolute(trimmed, baseUrl);
  if (!full) return null;
  return SAFE_SCHEMES.has(new URL(full).protocol) ? full : null;
}

function hasText(content: readonly HistoriaInline[]): boolean {
  return content.some((child) =>
    child.type === 'text'
      ? child.text.trim() !== ''
      : child.type === 'link' && child.children.some((c) => c.type === 'text' && c.text.trim()),
  );
}

/** Without the line breaks at either end, which only make a block taller. */
function trimBreaks<T extends HistoriaInline>(content: T[]): T[] {
  let start = 0;
  let end = content.length;
  while (start < end && content[start]?.type === 'linebreak') start++;
  while (end > start && content[end - 1]?.type === 'linebreak') end--;
  return content.slice(start, end);
}

/**
 * Rich text as plain text: blocks apart by a blank line, list items each on a line,
 * line breaks kept. For a summary, a search index, or alt text.
 */
export function toPlainText(content: HistoriaRichText): string {
  const line = (children: readonly HistoriaInline[]): string =>
    children
      .map((child) =>
        child.type === 'text'
          ? child.text
          : child.type === 'linebreak'
            ? '\n'
            : line(child.children),
      )
      .join('');
  return content
    .map((block) =>
      block.type === 'list'
        ? block.items.map((item) => line(item)).join('\n')
        : line(block.children),
    )
    .join('\n\n');
}
