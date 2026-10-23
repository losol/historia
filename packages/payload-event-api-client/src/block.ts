/**
 * The block an editor puts on a page to list events from Eventuras. The block
 * holds what to list; the site renders it (see the README).
 */

import type { Block } from 'payload';

export const EVENT_LIST_BLOCK_SLUG = 'eventList';

export interface EventListBlockFields {
  heading?: string | null;
  collectionId?: number | null;
  limit?: number | null;
  includePast?: boolean | null;
}

export const EventListBlock: Block = {
  slug: EVENT_LIST_BLOCK_SLUG,
  interfaceName: 'EventListBlock',
  labels: {
    singular: 'Event list',
    plural: 'Event lists',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
    },
    {
      name: 'collectionId',
      type: 'number',
      label: 'Collection',
      admin: {
        description:
          'Only events in this Eventuras collection (its id). Empty lists all upcoming events.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
      admin: { step: 1 },
    },
    {
      name: 'includePast',
      type: 'checkbox',
      label: 'Include past events',
      defaultValue: false,
    },
  ],
};
