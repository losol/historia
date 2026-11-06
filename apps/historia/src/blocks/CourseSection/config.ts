import type { Block } from 'payload';

/**
 * A section of a course's syllabus: a heading and the steps under it, in the
 * order participants take them. Sections are ordered as blocks.
 *
 * A step is a document of one of the step collections. Today that is only
 * lessons; a quiz or an assignment will be another collection added to
 * `relationTo`, so the syllabus can hold them without a data migration.
 * A step may appear in several courses: the syllabus, not the step, says which
 * courses it belongs to.
 */
export const CourseSection: Block = {
  slug: 'courseSection',
  interfaceName: 'CourseSectionBlock',
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
      name: 'items',
      label: 'Steps',
      type: 'relationship',
      // @ts-expect-error - not a CollectionSlug until Lessons is registered in the config
      relationTo: ['lessons'],
      hasMany: true,
      admin: {
        description: 'The lessons (and later quizzes) in this section, in order.',
      },
    },
  ],
};
