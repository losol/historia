import { describe, expect, it } from 'vitest';
import type { CourseSyllabus } from '@/payload-types';
import { formatDuration } from './labels';
import {
  courseDuration,
  courseSections,
  courseSteps,
  type LessonSummary,
  stepWithNeighbours,
  syllabusLessonIds,
} from './syllabus';

const lesson = (id: string, extra: Partial<LessonSummary> = {}): LessonSummary => ({
  id,
  resourceId: `r${id}`,
  slug: `lesson-${id}`,
  title: `Lesson ${id}`,
  ...extra,
});

const item = (id: string) => ({ relationTo: 'lessons' as const, value: id });

const syllabus: CourseSyllabus = [
  { id: 's1', title: 'Basics', items: [item('a'), item('b')] },
  { id: 's2', title: '  ', items: [item('c')] },
  { id: 's3', title: 'Advanced', items: [item('d')] },
];

describe('syllabusLessonIds', () => {
  it('lists the lessons in order, across the sections', () => {
    expect(syllabusLessonIds(syllabus)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('reads populated lessons by their id, and each once', () => {
    const populated = { relationTo: 'lessons' as const, value: { id: 'a' } as never };
    expect(syllabusLessonIds([{ items: [populated, item('b'), item('a')] }])).toEqual(['a', 'b']);
  });

  it('is empty for a course without a syllabus', () => {
    expect(syllabusLessonIds(null)).toEqual([]);
    expect(syllabusLessonIds([{ items: null }])).toEqual([]);
  });
});

describe('courseSections', () => {
  it('numbers the lessons across the sections', () => {
    const sections = courseSections(
      syllabus,
      ['a', 'b', 'c', 'd'].map((id) => lesson(id)),
    );
    expect(sections.map((s) => s.steps.map((step) => step.number))).toEqual([[1, 2], [3], [4]]);
    expect(sections.map((s) => s.title)).toEqual(['Basics', null, 'Advanced']);
    expect(sections[0].steps[1].sectionTitle).toBe('Basics');
  });

  // Unpublished, on another website, or without a slug in this language.
  it('leaves out the lessons a reader cannot open, and the sections they empty', () => {
    const sections = courseSections(syllabus, [
      lesson('a'),
      lesson('c'),
      lesson('d', { slug: null }),
    ]);
    expect(sections.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(courseSteps(sections).map((step) => [step.id, step.number])).toEqual([
      ['a', 1],
      ['c', 2],
    ]);
  });

  it('keeps the syllabus order, not the order the lessons were read in', () => {
    const sections = courseSections(
      syllabus,
      ['d', 'c', 'b', 'a'].map((id) => lesson(id)),
    );
    expect(courseSteps(sections).map((step) => step.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('places a lesson that is in the syllabus twice once', () => {
    const twice: CourseSyllabus = [{ items: [item('a'), item('b')] }, { items: [item('a')] }];
    const sections = courseSections(twice, [lesson('a'), lesson('b')]);
    expect(courseSteps(sections).map((step) => step.id)).toEqual(['a', 'b']);
    expect(sections).toHaveLength(1);
  });
});

describe('stepWithNeighbours', () => {
  const steps = courseSteps(
    courseSections(
      syllabus,
      ['a', 'b', 'c'].map((id) => lesson(id)),
    ),
  );

  it('finds the lessons before and after, across a section', () => {
    const found = stepWithNeighbours(steps, 'rb');
    expect(found?.previous?.id).toBe('a');
    expect(found?.current.id).toBe('b');
    expect(found?.next?.id).toBe('c');
  });

  it('has no previous on the first lesson and no next on the last', () => {
    expect(stepWithNeighbours(steps, 'ra')?.previous).toBeNull();
    expect(stepWithNeighbours(steps, 'rc')?.next).toBeNull();
  });

  it('is null for a lesson that is not in the course', () => {
    expect(stepWithNeighbours(steps, 'rd')).toBeNull();
  });
});

describe('courseDuration', () => {
  const steps = courseSteps(
    courseSections(syllabus, [
      lesson('a', { durationMinutes: 10 }),
      lesson('b', { durationMinutes: 25 }),
      lesson('c'),
    ]),
  );

  it("uses the course's own figure when it has one", () => {
    expect(courseDuration(90, steps)).toBe(90);
  });

  it('adds up the lessons that have one otherwise', () => {
    expect(courseDuration(null, steps)).toBe(35);
    expect(courseDuration(0, steps)).toBe(35);
  });

  it('is null when nothing is known', () => {
    expect(courseDuration(undefined, [])).toBeNull();
    expect(courseDuration(null, courseSteps(courseSections(syllabus, [lesson('a')])))).toBeNull();
  });
});

describe('formatDuration', () => {
  it('writes minutes, hours, and both', () => {
    expect(formatDuration(45, 'no')).toBe('45 min');
    expect(formatDuration(60, 'no')).toBe('1 t');
    expect(formatDuration(90, 'no')).toBe('1 t 30 min');
    expect(formatDuration(150, 'en')).toBe('2 h 30 min');
  });
});
