import type { Field } from 'payload';
import { Nav } from '@/blocks/Nav/config';

export const footer: Field = {
  name: 'footer',
  label: 'Footer',
  type: 'group',
  fields: [
    {
      name: 'navigation',
      label: 'Footer Navigation',
      type: 'blocks',
      blocks: [Nav],
      admin: {
        description: 'Navigation for the footer',
      },
    },
  ],
};
