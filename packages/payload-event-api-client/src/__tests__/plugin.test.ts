import type { CollectionConfig, Config } from 'payload';
import { describe, expect, it } from 'vitest';
import { EVENT_LIST_BLOCK_SLUG } from '../block';
import { eventApiClientPlugin } from '../plugin';

const pages = (): CollectionConfig => ({
  slug: 'pages',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'story', type: 'blocks', blocks: [{ slug: 'content', fields: [] }] },
          ],
        },
      ],
    },
  ],
});

const blockSlugs = (config: Config) => {
  const tabs = config.collections?.[0]?.fields[0];
  const story = tabs?.type === 'tabs' ? tabs.tabs[0]?.fields[1] : undefined;
  return story?.type === 'blocks' ? story.blocks.map((b) => b.slug) : [];
};

describe('eventApiClientPlugin', () => {
  it('adds the block to the story field, inside tabs', () => {
    const config = eventApiClientPlugin()({ collections: [pages()] } as Config);
    expect(blockSlugs(config)).toEqual(['content', EVENT_LIST_BLOCK_SLUG]);
  });

  it('adds it once', () => {
    const config = eventApiClientPlugin()(
      eventApiClientPlugin()({ collections: [pages()] } as Config),
    );
    expect(blockSlugs(config)).toEqual(['content', EVENT_LIST_BLOCK_SLUG]);
  });

  it('leaves other collections alone', () => {
    const articles = { ...pages(), slug: 'articles' };
    const config = eventApiClientPlugin()({ collections: [articles, pages()] } as Config);
    expect(blockSlugs(config)).toEqual(['content']);
    expect(blockSlugs({ collections: [config.collections?.[1]] } as Config)).toEqual([
      'content',
      EVENT_LIST_BLOCK_SLUG,
    ]);
  });

  it('fails loudly when nothing matches, rather than silently adding nothing', () => {
    expect(() =>
      eventApiClientPlugin({ collections: ['posts'] })({ collections: [pages()] } as Config),
    ).toThrow(/no blocks field/);
  });

  it('does nothing when off', () => {
    const config = eventApiClientPlugin({ enabled: false })({ collections: [pages()] } as Config);
    expect(blockSlugs(config)).toEqual(['content']);
  });
});
