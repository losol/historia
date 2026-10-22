import type { Field } from 'payload';
import { Nav } from '@/blocks/Nav/config';

export const header: Field = {
  name: 'header',
  label: 'Header',
  type: 'group',
  fields: [
    {
      name: 'navigation',
      label: 'Main navigation',
      type: 'blocks',
      blocks: [Nav],
      admin: {
        description: 'The links in the top bar, in order. Section titles are not shown.',
      },
    },
  ],
};
