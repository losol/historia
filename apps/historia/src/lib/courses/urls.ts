import { getDocUrl } from '@/app/(frontend)/[locale]/c/[collection]/pageCollections';

type Addressable = { slug?: string | null; resourceId: string };

/** The course's page: `/no/c/kurs/{slug}--{resourceId}`. */
export const getCourseUrl = (locale: string, course: Addressable): string =>
  getDocUrl({
    locale,
    collection: 'courses',
    resourceId: course.resourceId,
    slug: course.slug ?? '',
  });

/**
 * A lesson's page, under the course it is read in:
 * `/no/c/kurs/{course}--{resourceId}/{lesson}--{resourceId}`. A lesson can be
 * in several courses, and has one address in each.
 */
export const getLessonUrl = (locale: string, course: Addressable, lesson: Addressable): string =>
  `${getCourseUrl(locale, course)}/${lesson.slug ?? ''}--${lesson.resourceId}`;
