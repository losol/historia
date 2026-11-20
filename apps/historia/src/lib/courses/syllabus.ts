import type { CourseSyllabus } from '@/payload-types';

/** What the course pages show of a lesson: enough for a link, a line in the syllabus and a meta tag. */
export type LessonSummary = {
  id: string;
  resourceId: string;
  slug?: string | null;
  title: string;
  lead?: string | null;
  durationMinutes?: number | null;
};

/** A lesson in its place in a course: its number, counted across the sections, and its section. */
export type CourseStep = LessonSummary & {
  /** 1 for the first lesson of the course. */
  number: number;
  sectionTitle: string | null;
};

export type CourseSection = {
  id: string;
  title: string | null;
  steps: CourseStep[];
};

type SyllabusItem = NonNullable<NonNullable<CourseSyllabus>[number]['items']>[number];

const lessonId = (item: SyllabusItem): string | null => {
  if (item?.relationTo !== 'lessons' || item.value == null) return null;
  return typeof item.value === 'object' ? item.value.id : item.value;
};

/**
 * The ids of the lessons in a syllabus, in order. The values are ids when read
 * by a visitor, who may not read lessons, and lessons when populated in a preview.
 */
export function syllabusLessonIds(syllabus: CourseSyllabus | null | undefined): string[] {
  const ids: string[] = [];
  for (const section of syllabus ?? []) {
    for (const item of section.items ?? []) {
      const id = lessonId(item);
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/**
 * The sections of a course as a reader sees them: only the lessons in
 * `lessons`, which are the ones the reader may open (published, on this
 * website, with a slug to link to), numbered in order across the sections. A
 * section left without lessons is left out, so a course whose lessons are all
 * unpublished reads as a course without a syllabus.
 */
export function courseSections(
  syllabus: CourseSyllabus | null | undefined,
  lessons: readonly LessonSummary[],
): CourseSection[] {
  const byId = new Map(lessons.filter((l) => l.slug).map((l) => [l.id, l]));
  const placed = new Set<string>();
  const sections: CourseSection[] = [];
  let number = 0;

  for (const [index, section] of (syllabus ?? []).entries()) {
    const title = section.title?.trim() || null;
    const steps: CourseStep[] = [];
    for (const item of section.items ?? []) {
      const id = lessonId(item);
      const lesson = id ? byId.get(id) : undefined;
      // The syllabus refuses a lesson twice; an older version may still hold one.
      if (!lesson || placed.has(lesson.id)) continue;
      placed.add(lesson.id);
      number += 1;
      steps.push({ ...lesson, number, sectionTitle: title });
    }
    if (steps.length) sections.push({ id: section.id ?? String(index), title, steps });
  }
  return sections;
}

/** Every lesson of the course, in order. */
export const courseSteps = (sections: readonly CourseSection[]): CourseStep[] =>
  sections.flatMap((section) => section.steps);

/** A lesson and the ones before and after it in the course, or null when it is not in it. */
export function stepWithNeighbours(
  steps: readonly CourseStep[],
  resourceId: string,
): { previous: CourseStep | null; current: CourseStep; next: CourseStep | null } | null {
  const index = steps.findIndex((step) => step.resourceId === resourceId);
  if (index === -1) return null;
  return {
    previous: steps[index - 1] ?? null,
    current: steps[index],
    next: steps[index + 1] ?? null,
  };
}

/**
 * How long a course takes, in minutes: the course's own figure when it has
 * one, else the sum of the lessons that have one. Null when nothing is known,
 * so a course without durations shows none rather than "0 min".
 */
export function courseDuration(
  durationMinutes: number | null | undefined,
  steps: readonly CourseStep[],
): number | null {
  if (typeof durationMinutes === 'number' && durationMinutes > 0) return durationMinutes;
  const known = steps
    .map((step) => step.durationMinutes)
    .filter((minutes): minutes is number => typeof minutes === 'number' && minutes > 0);
  return known.length ? known.reduce((sum, minutes) => sum + minutes, 0) : null;
}
