import type { Field } from 'payload';

type Step = { relationTo?: string; value?: unknown } | null | undefined;
type Section = { items?: Step[] | null } | null | undefined;

const stepKey = (step: Step): string | null => {
  if (!step?.relationTo || step.value == null) return null;
  const value = step.value;
  const id = typeof value === 'object' ? (value as { id?: unknown }).id : value;
  return id == null ? null : `${step.relationTo}:${String(id)}`;
};

/**
 * How many steps are in the syllabus more than once, in one section or across
 * several. A lesson is finished once and has one address in a course, so a
 * second copy has no "next" of its own and nothing to complete.
 */
export function repeatedSteps(sections: Section[] | null | undefined): number {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const section of sections ?? []) {
    for (const step of section?.items ?? []) {
      const key = stepKey(step);
      if (!key) continue;
      if (seen.has(key)) repeated.add(key);
      seen.add(key);
    }
  }
  return repeated.size;
}

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
  validate: (value) => {
    const repeated = repeatedSteps(value as Section[] | null | undefined);
    if (repeated === 0) return true;
    return repeated === 1
      ? 'A lesson is in the syllabus twice. A course can hold each lesson once.'
      : `${repeated} lessons are in the syllabus more than once. A course can hold each lesson once.`;
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
      relationTo: ['lessons'],
      hasMany: true,
      admin: {
        description:
          'The lessons in this section, in order. Pick existing ones, or make a new one with the +.',
      },
    },
  ],
};
