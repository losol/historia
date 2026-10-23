import type { Block } from 'payload';

/**
 * A list of upcoming happenings. By default the site's own; Eventuras is an option,
 * fetched when the page renders (see `lib/eventuras/config`).
 */
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
      name: 'source',
      type: 'select',
      defaultValue: 'historia',
      options: [
        { label: "This site's happenings", value: 'historia' },
        { label: 'Eventuras', value: 'eventuras' },
      ],
      admin: {
        description:
          'Where the happenings come from. Eventuras needs EVENTURAS_API_URL and EVENTURAS_SITE_URL on the server.',
      },
    },
    {
      name: 'collectionId',
      type: 'number',
      label: 'Eventuras collection',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'eventuras',
        description:
          'Only events in this Eventuras collection (its id). Empty lists all upcoming events.',
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
