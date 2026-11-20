import type { PayloadRequest, TypedLocale } from 'payload';
import { getLessonUrl } from '@/lib/courses/urls';
import { previewUrl } from '@/utilities/generatePreviewPath';

type LessonData = { id?: unknown; slug?: unknown; resourceId?: unknown } | null | undefined;

/**
 * Where to preview a lesson: under the oldest course whose syllabus holds it,
 * as a reader reaches it. A lesson has no page of its own, so one that is in
 * no course yet has no preview.
 *
 * The courses are found by `syllabus.items.value`, not through the `courses`
 * join, which repeats a course once per section (see Lessons).
 */
export async function lessonPreviewUrl(
  data: LessonData,
  req: PayloadRequest,
): Promise<string | null> {
  if (typeof data?.id !== 'string' || typeof data.resourceId !== 'string') return null;
  const slug = typeof data.slug === 'string' ? data.slug : '';
  const locale = req.locale || process.env.NEXT_PUBLIC_CMS_DEFAULT_LOCALE || 'no';

  const { docs } = await req.payload.find({
    collection: 'courses',
    draft: true,
    depth: 0,
    limit: 1,
    locale: locale as TypedLocale,
    overrideAccess: false,
    req,
    select: { slug: true, resourceId: true },
    // The oldest, so the preview stays under one course as more are added.
    sort: 'createdAt',
    where: { 'syllabus.items.value': { equals: data.id } },
  });
  const course = docs[0];
  if (!course?.resourceId) return null;

  return previewUrl({
    path: getLessonUrl(locale, course, { slug, resourceId: data.resourceId }),
    collection: 'lessons',
    slug,
    req,
  });
}
