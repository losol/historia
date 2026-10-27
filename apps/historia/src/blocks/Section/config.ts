import type { Block } from 'payload';

/**
 * A section of a course's syllabus: a heading and the lessons under it, in the
 * order participants take them. Sections are ordered as blocks.
 */
export const Section: Block = {
  slug: 'section',
  interfaceName: 'SectionBlock',
  labels: {
    singular: 'Section',
    plural: 'Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'lessons',
      type: 'relationship',
      // @ts-expect-error - not a CollectionSlug until Lessons is registered in the config
      relationTo: 'lessons',
      hasMany: true,
      admin: {
        description: 'The lessons in this section, in order.',
      },
    },
  ],
};
