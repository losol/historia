import type { Field } from 'payload';

export const publishedAt: Field = {
  name: 'publishedAt',
  type: 'date',
  admin: {
    date: {
      pickerAppearance: 'dayAndTime',
    },
  },
  defaultValue: () => new Date(),
};
