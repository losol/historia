import type { Field } from 'payload';

/**
 * The syllabus of a course: its sections, in order, each with the steps
 * participants take and an optional heading over them.
 *
 * The heading is optional so a short course needs no parts: one section without
 * a title is a plain list of lessons, and the course page shows it as one.
 *
 * A step is a document of one of the step collections. Today that is only
 * lessons; another kind of step will be another collection added to
 * `relationTo`, so the syllabus can hold it without a data migration. A step
 * may appear in several courses: the syllabus, not the step, says which courses
 * it belongs to. New lessons are made right here, with the + beside the field.
 *
 * An array, not blocks: there is one kind of section, and a join field can
 * follow a relationship through an array but not through blocks, which is what
 * lets a lesson list the courses it is used in (`courses` on Lessons).
 */
export const syllabus: Field = {
  name: 'syllabus',
  type: 'array',
  interfaceName: 'CourseSyllabus',
  labels: { singular: 'Section', plural: 'Sections' },
  admin: {
    description:
      'The lessons of the course, in the order participants take them. Leave empty for a short course where the story above is the whole course.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Leave empty in a course without parts.',
      },
    },
    {
      name: 'items',
      label: 'Steps',
      type: 'relationship',
      // @ts-expect-error - not a CollectionSlug until Lessons is registered in the config
      relationTo: ['lessons'],
      hasMany: true,
      admin: {
        description:
          'The lessons in this section, in order. Pick existing ones, or make a new one with the +.',
      },
    },
  ],
};
