// The demo content: enough to see the site's pages and components in use after
// `aspire run`, not a realistic dataset. Text is Norwegian, the default locale.

import type { Palette } from './images.ts';

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
          'Bilder, produkter og et artikkelarkiv',
        ]),
        paragraph('Alle blokktypene er samlet på ', link('komponentsiden', '/no/komponenter'), '.'),
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
          'Images, products and an article archive',
        ]),
        paragraph('Every block type is on the ', link('components page', '/en/components'), '.'),
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

// Images and products are created first; the pages that use them are built from
// their ids.

export const images: { file: string; no: string; en: string; palette: Palette }[] = [
  {
    file: 'solnedgang.png',
    no: 'Solnedgang over havet',
    en: 'Sunset over the sea',
    palette: {
      sky: [
        [250, 176, 110],
        [233, 110, 90],
      ],
      sea: [
        [70, 90, 120],
        [30, 45, 70],
      ],
      sun: [255, 226, 160],
    },
  },
  {
    file: 'morgen.png',
    no: 'Morgen på fjorden',
    en: 'Morning on the fjord',
    palette: {
      sky: [
        [170, 205, 230],
        [235, 240, 235],
      ],
      sea: [
        [95, 140, 160],
        [40, 80, 100],
      ],
      sun: [255, 250, 225],
    },
  },
  {
    file: 'natt.png',
    no: 'Midnattssol',
    en: 'Midnight sun',
    palette: {
      sky: [
        [60, 50, 110],
        [215, 130, 120],
      ],
      sea: [
        [50, 50, 90],
        [20, 20, 45],
      ],
      sun: [255, 200, 140],
    },
  },
];

export const products = [
  {
    // Prices are stored ex. VAT in øre: 19920 is 249 kr with 25 % VAT.
    price: 19920,
    no: {
      title: 'Plakat: Fyret på odden',
      slug: 'plakat-fyret',
      lead: 'Trykk i A3 på matt papir.',
    },
    en: {
      title: 'Poster: The lighthouse on the point',
      slug: 'poster-lighthouse',
      lead: 'A3 print on matte paper.',
    },
  },
  {
    price: 27920,
    no: { title: 'Bok: Losene langs kysten', slug: 'bok-losene', lead: 'Innbundet, 240 sider.' },
    en: { title: 'Book: The coastal pilots', slug: 'book-pilots', lead: 'Hardcover, 240 pages.' },
  },
];

const imageBlock = (media: string, caption: string) => ({
  blockType: 'image',
  media,
  caption: richText(paragraph(caption)),
});

const sectionIntro = (title: string, text: string) =>
  contentBlock(heading('h2', title), paragraph(text));

const productsBlock = (productIds: string[]) => ({
  blockType: 'products',
  products: productIds,
  showImage: true,
});

// No description: it is not a localized field, so the English update would
// overwrite the Norwegian one.
const archiveBlock = () => ({
  blockType: 'archive',
  relationTo: 'articles',
  limit: 6,
  showImages: true,
});

/** One page with every block type a page can hold. */
export const componentsPage = ({
  mediaIds,
  productIds,
}: {
  mediaIds: string[];
  productIds: string[];
}) => ({
  no: {
    name: 'Komponenter',
    title: 'Komponenter',
    slug: 'komponenter',
    lead: 'Alle blokktypene en side kan ha, med demoinnhold.',
    story: [
      contentBlock(
        heading('h2', 'Innhold'),
        paragraph(
          'En innholdsblokk er riktekst: overskrifter, avsnitt, ',
          bold('uthevet tekst'),
          ' og lister.',
        ),
        list('bullet', ['Punktliste', 'med flere punkter']),
      ),
      imageBlock(mediaIds[1], 'En bildeblokk med bildetekst.'),
      productsBlock(productIds),
      sectionIntro('Arkiv', 'Et arkiv viser de siste artiklene.'),
      archiveBlock(),
    ],
  },
  en: {
    name: 'Components',
    title: 'Components',
    slug: 'components',
    lead: 'Every block type a page can hold, with demo content.',
    story: [
      contentBlock(
        heading('h2', 'Content'),
        paragraph(
          'A content block is rich text: headings, paragraphs, ',
          bold('bold text'),
          ' and lists.',
        ),
        list('bullet', ['A bulleted list', 'with several items']),
      ),
      imageBlock(mediaIds[1], 'An image block with a caption.'),
      productsBlock(productIds),
      sectionIntro('Archive', 'An archive shows the latest articles.'),
      archiveBlock(),
    ],
  },
});
