import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';

export const Archive: Block = {
  slug: 'archive',
  interfaceName: 'ArchiveBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Heading',
      admin: {
        description: 'Shown above the list, e.g. "Siste nytt". Leave empty for none.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ];
        },
      }),
      label: 'Intro',
    },
    {
      name: 'relationTo',
      type: 'select',
      defaultValue: 'articles',
      label: 'Collections To Show',
      options: [
        {
          label: 'Articles',
          value: 'articles',
        },
        {
          label: 'Happenings',
          value: 'happenings',
        },
        {
          label: 'Notes',
          value: 'notes',
        },
        {
          label: 'Cases',
          value: 'cases',
        },
      ],
    },
    {
      name: 'topics',
      type: 'relationship',
      hasMany: true,
      required: false,
      label: 'Topics to show',
      relationTo: 'topics',
    },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      label: 'Layout',
      options: [
        { label: 'Grid of cards', value: 'grid' },
        { label: 'Featured: the first story large, the rest beside it', value: 'featured' },
        { label: 'List of compact rows', value: 'list' },
        { label: 'Poster: the first story on a large card, its lead beside it', value: 'poster' },
        { label: 'Numbered: a very large heading over numbered titles', value: 'numbered' },
        { label: 'Band: the first story on a full-width coloured band', value: 'band' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'showImages',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show Images',
        },
        {
          name: 'showAllLink',
          type: 'checkbox',
          defaultValue: false,
          label: 'Link to the full list',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'limit',
          type: 'number',
          admin: {
            step: 1,
          },
          defaultValue: 10,
          label: 'Limit',
        },
        {
          name: 'skip',
          type: 'number',
          min: 0,
          admin: {
            step: 1,
            description: 'Leave out the first ones, e.g. 1 when a block above shows the newest.',
          },
          defaultValue: 0,
          label: 'Skip',
        },
      ],
    },
  ],
  labels: {
    plural: 'Archives',
    singular: 'Archive',
  },
};
