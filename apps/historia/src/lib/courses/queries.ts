import { cache } from 'react';
import configPromise from '@payload-config';
import { getPayload, type TypedLocale } from 'payload';
import { siteWhere } from '@/lib/siteWhere';
import { getCurrentWebsiteId } from '@/lib/website';
import type { Course, Lesson } from '@/payload-types';
import {
  type CourseSection,
  type CourseStep,
  courseSections,
  courseSteps,
  type LessonSummary,
  syllabusLessonIds,
} from './syllabus';

/**
 * Whether a reader may open the lessons of a course. A course for enrolled
 * participants shows its page and syllabus to everyone, and keeps its lessons
 * closed until enrolment exists to open them. An editor's preview sees them.
 */
export const lessonsOpen = (course: Pick<Course, 'access'>, draft: boolean): boolean =>
  draft || course.access !== 'enrolled';

/**
 * The course with this resourceId on the current website: published, or the
 * latest draft in a preview. Read as a visitor, so its lessons are ids.
 *
 * The arguments are plain values so React's `cache` shares the result between
 * a page and its metadata.
 */
export const findCourse = cache(
  async (resourceId: string, locale: string, draft: boolean): Promise<Course | null> => {
    const payload = await getPayload({ config: configPromise });
    const websiteId = await getCurrentWebsiteId();
    if (!websiteId) return null;

    const { docs } = await payload.find({
      collection: 'courses',
      draft,
      locale: locale as TypedLocale,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        and: [
          { resourceId: { equals: resourceId } },
          siteWhere(payload, 'courses', websiteId, { draft }),
        ],
      },
    });
    return docs[0] ?? null;
  },
);

export type CourseOutline = {
  sections: CourseSection[];
  steps: CourseStep[];
};

/**
 * The syllabus of a course as a reader sees it, with the lessons they may open.
 *
 * Visitors cannot read lessons through the API (see Lessons), so the course is
 * the door: this reads past access control, but only the lessons in this
 * course's syllabus, on this website, and published, or their latest drafts in
 * a preview. A lesson that was never published, or was unpublished, is left
 * out of the syllabus, and with it its link and its place in previous and next.
 *
 * Cached by the course object, which `findCourse` hands out once per request.
 */
export const courseOutline = cache(
  async (course: Course, locale: string, draft: boolean): Promise<CourseOutline> => {
    const ids = syllabusLessonIds(course.syllabus);
    if (ids.length === 0) return { sections: [], steps: [] };

    const payload = await getPayload({ config: configPromise });
    const websiteId = await getCurrentWebsiteId();
    if (!websiteId) return { sections: [], steps: [] };

    const { docs } = await payload.find({
      collection: 'lessons',
      draft,
      locale: locale as TypedLocale,
      depth: 0,
      limit: ids.length,
      pagination: false,
      overrideAccess: true,
      select: {
        title: true,
        lead: true,
        slug: true,
        resourceId: true,
        durationMinutes: true,
      },
      where: {
        and: [{ id: { in: ids } }, siteWhere(payload, 'lessons', websiteId, { draft })],
      },
    });

    const sections = courseSections(course.syllabus, docs as LessonSummary[]);
    return { sections, steps: courseSteps(sections) };
  },
);

/**
 * One lesson, whole, for its page. Only call it with a lesson from
 * `courseOutline`: that is what checks it belongs to the course, and the course
 * to this website. Read past access control, as there; the website and the
 * published status are checked again here all the same.
 */
export const findLesson = cache(
  async (id: string, locale: string, draft: boolean): Promise<Lesson | null> => {
    const payload = await getPayload({ config: configPromise });
    const websiteId = await getCurrentWebsiteId();
    if (!websiteId) return null;

    const { docs } = await payload.find({
      collection: 'lessons',
      draft,
      locale: locale as TypedLocale,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: {
        and: [{ id: { equals: id } }, siteWhere(payload, 'lessons', websiteId, { draft })],
      },
    });
    return docs[0] ?? null;
  },
);
