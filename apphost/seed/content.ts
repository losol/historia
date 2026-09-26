// The demo content: enough to see the site's pages and components in use after
// `aspire run`, not a realistic dataset. Text is Norwegian, the default locale.

// Lexical rich text, built from the few node types the demo needs.
type LexicalNode = Record<string, unknown>;

const text = (value: string, format = 0): LexicalNode => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});

const element = (type: string, children: LexicalNode[], extra: LexicalNode = {}): LexicalNode => ({
  type,
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  ...extra,
});

export const paragraph = (...children: (string | LexicalNode)[]): LexicalNode =>
  element(
    'paragraph',
    children.map((child) => (typeof child === 'string' ? text(child) : child)),
    { textFormat: 0, textStyle: '' },
  );

export const heading = (tag: 'h2' | 'h3', value: string): LexicalNode =>
  element('heading', [text(value)], { tag });

export const bold = (value: string): LexicalNode => text(value, 1);

export const link = (value: string, url: string): LexicalNode =>
  element('link', [text(value)], { fields: { linkType: 'custom', url, newTab: false } });

export const list = (kind: 'bullet' | 'number', items: string[]): LexicalNode =>
  element(
    'list',
    items.map((item, index) => element('listitem', [text(item)], { value: index + 1 })),
    { listType: kind, tag: kind === 'number' ? 'ol' : 'ul', start: 1 },
  );

export const richText = (...children: LexicalNode[]) => ({
  root: element('root', children),
});

export const contentBlock = (...children: LexicalNode[]) => ({
  blockType: 'content',
  richText: richText(...children),
});

export const website = {
  name: 'Historia demo',
  title: 'Historia demo',
  summary: 'Demoinnhold laget av seed-skriptet i apphost/seed.',
};

// Each document comes as a Norwegian version, created first, and the English
// values of its localized fields, applied as a `?locale=en` update. The story
// blocks line up by position: the English update reuses the Norwegian blocks'
// ids and fills in their English text.

export const homePage = {
  no: {
    name: 'Forside',
    title: 'Velkommen til Historia-demoen',
    slug: 'home',
    lead: 'Dette nettstedet er fylt med demoinnhold, så du kan se sidetypene og komponentene i bruk.',
    story: [
      contentBlock(
        heading('h2', 'Hva finner du her?'),
        paragraph(
          'Innholdet er laget av ',
          bold('apphost/seed'),
          ' når Aspire starter mot en tom database. Rediger det gjerne i ',
          link('admin', '/admin'),
          '.',
        ),
        list('bullet', [
          'Artikler, nok til at listen blar over flere sider',
          'Riktekst med overskrifter, lister og lenker',
        ]),
        heading('h3', 'Slik kommer du i gang'),
        list('number', [
          'Logg inn i admin med demobrukeren',
          'Åpne en artikkel og endre teksten',
          'Se endringen på nettstedet',
        ]),
      ),
    ],
  },
  en: {
    name: 'Home',
    title: 'Welcome to the Historia demo',
    slug: 'home',
    lead: 'This site is filled with demo content, so you can see its page types and components in use.',
    story: [
      contentBlock(
        heading('h2', 'What is here?'),
        paragraph(
          'The content is created by ',
          bold('apphost/seed'),
          ' when Aspire starts against an empty database. Feel free to edit it in the ',
          link('admin', '/admin'),
          '.',
        ),
        list('bullet', [
          'Articles, enough for the list to span several pages',
          'Rich text with headings, lists and links',
        ]),
        heading('h3', 'Getting started'),
        list('number', [
          'Sign in to the admin as the demo user',
          'Open an article and change its text',
          'See the change on the site',
        ]),
      ),
    ],
  },
};

const articleTopics = [
  { no: 'Fyret på odden', en: 'The lighthouse on the point' },
  { no: 'Kystkulturen langs leia', en: 'Coastal culture along the fairway' },
  { no: 'Fiskeværet om vinteren', en: 'The fishing village in winter' },
  { no: 'Handelsstedet ved sundet', en: 'The trading post by the sound' },
  { no: 'Losene og båtene deres', en: 'The pilots and their boats' },
];

/** 25 articles: more than the 20 a collection page shows, so paging has a second page. */
export const articles = Array.from({ length: 25 }, (_, index) => {
  const number = index + 1;
  const topic = articleTopics[index % articleTopics.length];
  return {
    // Spread over the last 25 days, newest first, so lists have a stable order.
    publishedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    no: {
      title: `${topic.no} (${number})`,
      slug: `demo-artikkel-${number}`,
      lead: `Demoartikkel nummer ${number}: ${topic.no.toLowerCase()}.`,
      story: [
        contentBlock(
          paragraph(
            `Dette er demoartikkel ${number}. Teksten er bare fyll, laget av seed-skriptet.`,
          ),
          heading('h2', 'Litt bakgrunn'),
          paragraph(
            'Artikler kan ha overskrifter, lister og ',
            link('lenker til andre sider', '/no/c/artikler'),
            '.',
          ),
        ),
      ],
    },
    en: {
      title: `${topic.en} (${number})`,
      slug: `demo-article-${number}`,
      lead: `Demo article number ${number}: ${topic.en.toLowerCase()}.`,
      story: [
        contentBlock(
          paragraph(
            `This is demo article ${number}. The text is filler, created by the seed script.`,
          ),
          heading('h2', 'Some background'),
          paragraph(
            'Articles can have headings, lists and ',
            link('links to other pages', '/en/c/articles'),
            '.',
          ),
        ),
      ],
    },
  };
});
