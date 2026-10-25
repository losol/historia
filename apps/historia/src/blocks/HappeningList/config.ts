import type { Block } from 'payload';

/** A list of the site's upcoming happenings, the next ones first. */
export const HappeningList: Block = {
  slug: 'happeningList',
  interfaceName: 'HappeningListBlock',
  labels: {
    singular: 'Happening list',
    plural: 'Happening lists',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        description: 'Shown above the list, e.g. "Neste kurs". Leave empty for none.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'limit',
          type: 'number',
          defaultValue: 10,
          min: 1,
          max: 100,
          admin: { step: 1, width: '50%' },
        },
        {
          name: 'includePast',
          type: 'checkbox',
          label: 'Include past happenings',
          defaultValue: false,
          admin: { width: '50%' },
        },
      ],
    },
  ],
};
