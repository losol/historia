import { describe, expect, it } from 'vitest';
import { type RawLexicalNode, toPlainText, toRichText } from '../richtext';

const context = { baseUrl: 'https://losvik.example.com', locale: 'no' };

// Lexical's nodes as Payload stores them, with the fields the SDK doesn't read.
const text = (value: string, format = 0): RawLexicalNode =>
  ({
    type: 'text',
    text: value,
    format,
    mode: 'normal',
    style: '',
    detail: 0,
    version: 1,
  }) as never;
const paragraph = (...children: RawLexicalNode[]): RawLexicalNode =>
  ({ type: 'paragraph', format: '', indent: 0, version: 1, textFormat: 0, children }) as never;
const link = (fields: RawLexicalNode['fields'], ...children: RawLexicalNode[]): RawLexicalNode =>
  ({ type: 'link', fields, children, format: '', indent: 0, version: 3 }) as never;
const linebreak: RawLexicalNode = { type: 'linebreak' };
const root = (...children: RawLexicalNode[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
});

describe('toRichText', () => {
  it('is empty for no text', () => {
    expect(toRichText(null, context)).toEqual([]);
    expect(toRichText({ root: null }, context)).toEqual([]);
    expect(toRichText(root(paragraph(), paragraph(text('  '))), context)).toEqual([]);
  });

  it('keeps paragraphs, their marks and line breaks, without breaks at the ends', () => {
    const rich = toRichText(
      root(
        paragraph(
          text('Ferja går ikke '),
          text('3. november', 1),
          text(' – ', 0),
          text('ingen', 3),
        ),
        paragraph(linebreak, text('Første linje'), linebreak, text('andre', 8 | 16), linebreak),
      ),
      context,
    );
    expect(rich).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Ferja går ikke ', marks: [] },
          { type: 'text', text: '3. november', marks: ['bold'] },
          { type: 'text', text: ' – ', marks: [] },
          { type: 'text', text: 'ingen', marks: ['bold', 'italic'] },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Første linje', marks: [] },
          { type: 'linebreak' },
          { type: 'text', text: 'andre', marks: ['underline', 'code'] },
        ],
      },
    ]);
  });

  it('makes a link absolute and keeps whether it opens anew', () => {
    const [block] = toRichText(
      root(
        paragraph(
          link(
            { linkType: 'custom', url: '/no/rutetabell', newTab: true },
            text('rutetabellen', 2),
          ),
          link({ linkType: 'custom', url: 'mailto:post@losvik.no' }, text('post')),
        ),
      ),
      context,
    );
    expect(block).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          url: 'https://losvik.example.com/no/rutetabell',
          newTab: true,
          document: null,
          children: [{ type: 'text', text: 'rutetabellen', marks: ['italic'] }],
        },
        {
          type: 'link',
          url: 'mailto:post@losvik.no',
          newTab: false,
          document: null,
          children: [{ type: 'text', text: 'post', marks: [] }],
        },
      ],
    });
  });

  it('leaves a link with nowhere safe to go as its text', () => {
    const [block] = toRichText(
      root(
        paragraph(
          link({ linkType: 'custom', url: 'javascript:alert(1)' }, text('klikk')),
          link({ linkType: 'custom', url: '' }, text(' her')),
          link(
            { linkType: 'internal', doc: { relationTo: 'notes', value: 'abc123' } },
            text(' og der'),
          ),
        ),
      ),
      context,
    );
    expect(block).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', text: 'klikk', marks: [] },
        { type: 'text', text: ' her', marks: [] },
        { type: 'text', text: ' og der', marks: [] },
      ],
    });
  });

  it('links to another document in Historia at its page, and says which it is', () => {
    const [block] = toRichText(
      root(
        paragraph(
          link(
            {
              linkType: 'internal',
              doc: {
                relationTo: 'notes',
                value: { id: 'n2', slug: 'dugnad', resourceId: 'x7k2p' },
              },
            },
            text('dugnaden'),
          ),
          link(
            {
              linkType: 'internal',
              doc: { relationTo: 'pages', value: { id: 'p1', slug: 'om-oss' } },
            },
            text('om oss'),
          ),
        ),
      ),
      context,
    );
    expect(block?.type === 'paragraph' && block.children).toEqual([
      {
        type: 'link',
        url: 'https://losvik.example.com/no/c/notert/dugnad--x7k2p',
        newTab: false,
        document: { collection: 'notes', slug: 'dugnad', resourceId: 'x7k2p' },
        children: [{ type: 'text', text: 'dugnaden', marks: [] }],
      },
      {
        type: 'link',
        url: 'https://losvik.example.com/no/om-oss',
        newTab: false,
        document: { collection: 'pages', slug: 'om-oss', resourceId: null },
        children: [{ type: 'text', text: 'om oss', marks: [] }],
      },
    ]);
  });

  it('keeps headings, quotes and lists, a list in a list flattened into it', () => {
    const item = (...children: RawLexicalNode[]): RawLexicalNode => ({
      type: 'listitem',
      children,
    });
    const rich = toRichText(
      root(
        { type: 'heading', tag: 'h3', children: [text('Program')] },
        { type: 'heading', tag: 'h9', children: [text('Rart')] },
        { type: 'quote', children: [text('Alle må ta med kaffe.')] },
        {
          type: 'list',
          listType: 'number',
          tag: 'ol',
          children: [
            item(text('Rydde kaia')),
            item(text('Male naustet'), {
              type: 'list',
              listType: 'bullet',
              tag: 'ul',
              children: [item(text('rødt'))],
            }),
            item(),
          ],
        },
        { type: 'list', listType: 'check', tag: 'ul', children: [item(text('Kaffe'))] },
      ),
      context,
    );
    expect(rich).toEqual([
      { type: 'heading', level: 3, children: [{ type: 'text', text: 'Program', marks: [] }] },
      { type: 'heading', level: 2, children: [{ type: 'text', text: 'Rart', marks: [] }] },
      { type: 'quote', children: [{ type: 'text', text: 'Alle må ta med kaffe.', marks: [] }] },
      {
        type: 'list',
        ordered: true,
        items: [
          [{ type: 'text', text: 'Rydde kaia', marks: [] }],
          [{ type: 'text', text: 'Male naustet', marks: [] }],
          [{ type: 'text', text: 'rødt', marks: [] }],
        ],
      },
      { type: 'list', ordered: false, items: [[{ type: 'text', text: 'Kaffe', marks: [] }]] },
    ]);
  });

  it("keeps what it doesn't know as its text: blocks inside it, or a paragraph", () => {
    const rich = toRichText(
      root(
        { type: 'block', fields: {}, children: null } as never,
        { type: 'layout', children: [paragraph(text('Inni'))] },
        { type: 'mention', text: '@Edith' },
        text(' sier hei'),
        paragraph(text('Etter')),
      ),
      context,
    );
    expect(rich).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'Inni', marks: [] }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: '@Edith', marks: [] },
          { type: 'text', text: ' sier hei', marks: [] },
        ],
      },
      { type: 'paragraph', children: [{ type: 'text', text: 'Etter', marks: [] }] },
    ]);
  });
});

describe('toPlainText', () => {
  it('puts blocks apart by a blank line and list items on lines of their own', () => {
    const rich = toRichText(
      root(
        paragraph(
          text('Dugnad '),
          link({ url: 'https://example.com' }, text('lørdag')),
          linebreak,
          text('kl. 10'),
        ),
        {
          type: 'list',
          listType: 'bullet',
          children: [
            { type: 'listitem', children: [text('Kaffe')] },
            { type: 'listitem', children: [text('Kake')] },
          ],
        },
      ),
      context,
    );
    expect(toPlainText(rich)).toBe('Dugnad lørdag\nkl. 10\n\nKaffe\nKake');
    expect(toPlainText([])).toBe('');
  });
});
