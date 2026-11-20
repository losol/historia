import { Story, StoryBody, StoryHeader } from '@eventuras/ratio-ui/blocks/Story';
import { Breadcrumb, Breadcrumbs } from '@eventuras/ratio-ui/core/Breadcrumbs';
import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Lead } from '@eventuras/ratio-ui/core/Lead';
import { Container } from '@eventuras/ratio-ui/layout/Container';
import { Link } from '@eventuras/ratio-ui-next';
import { Image } from '@eventuras/ratio-ui-next/Image';
import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';
import { RenderBlocks } from '@/blocks/RenderBlocks';
import { LessonPager } from '@/components/Course';
import { LivePreviewListener } from '@/components/LivePreviewListener';
import RichText from '@/components/RichText';
import { courseLabels, formatDuration } from '@/lib/courses/labels';
import { courseOutline, findCourse, findLesson, lessonsOpen } from '@/lib/courses/queries';
import { stepWithNeighbours } from '@/lib/courses/syllabus';
import { getCourseUrl, getLessonUrl } from '@/lib/courses/urls';
import { generateMeta } from '@/lib/seo';
import { getCurrentWebsite } from '@/lib/website';
import { getImageProps } from '@/utilities/image';
import {
  getLocalizedCollectionName,
  parseSlugWithResourceId,
  resolvePageCollection,
} from '../../pageCollections';

type Params = {
  locale: string;
  collection: string;
  /** The course: `{slug}--{resourceId}`. */
  slug: string;
  /** The lesson: `{slug}--{resourceId}`. */
  lesson: string;
};

type Args = { params: Promise<Params> };

/**
 * The course and the lesson a URL names, with the lesson's place in the
 * course, or null when there is nothing to show. The course is the door: the
 * lesson is looked up by its resourceId among the lessons of the course's
 * syllabus that a reader may open, never on its own, so a lesson that is
 * unpublished, on another website or in another course is not found here.
 */
async function resolveLesson(params: Params, draft: boolean) {
  const { locale, collection } = params;
  if (resolvePageCollection(collection, locale) !== 'courses') return null;

  const courseRef = parseSlugWithResourceId(params.slug);
  const lessonRef = parseSlugWithResourceId(params.lesson);
  if (!courseRef || !lessonRef) return null;

  const course = await findCourse(courseRef.resourceId, locale, draft);
  if (!course || !lessonsOpen(course, draft)) return null;

  const { steps } = await courseOutline(course, locale, draft);
  const place = stepWithNeighbours(steps, lessonRef.resourceId);
  if (!place) return null;

  return { course, total: steps.length, ...place };
}

export default async function LessonPage({ params: paramsPromise }: Readonly<Args>) {
  const { isEnabled: draft } = await draftMode();
  const params = await paramsPromise;
  const { locale } = params;

  const found = await resolveLesson(params, draft);
  if (!found) notFound();
  const { course, current, previous, next, total } = found;

  // The collection's name in another language, or an old slug of the course or
  // the lesson: one address per lesson in a course.
  const url = getLessonUrl(locale, course, current);
  if (`/${locale}/c/${params.collection}/${params.slug}/${params.lesson}` !== url) {
    permanentRedirect(url);
  }

  const lesson = await findLesson(current.id, locale, draft);
  if (!lesson) notFound();

  const t = courseLabels(locale);
  const collectionName = getLocalizedCollectionName('courses', locale);
  const imageProps = lesson.image ? getImageProps(lesson.image, 'landscape') : null;
  const eyebrow = [t.lesson(current.number, total), current.sectionTitle]
    .filter(Boolean)
    .join(' · ');

  return (
    <Container>
      <Story as="article" className="px-3">
        {draft && <LivePreviewListener />}

        <nav className="mb-4" aria-label={t.breadcrumbs}>
          <Breadcrumbs LinkComponent={Link}>
            <Breadcrumb href={`/${locale}/c/${collectionName}`}>
              {collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}
            </Breadcrumb>
            <Breadcrumb href={getCourseUrl(locale, course)}>{course.title}</Breadcrumb>
            <Breadcrumb>{lesson.title}</Breadcrumb>
          </Breadcrumbs>
        </nav>

        <StoryHeader>
          {imageProps?.url && (
            <>
              <Image
                src={imageProps.url}
                alt={imageProps.alt || lesson.title || ''}
                width={imageProps.width}
                height={imageProps.height}
                loading="eager"
              />
              {imageProps.caption && (
                <div className="text-sm text-muted-foreground mt-2">
                  <RichText data={imageProps.caption} />
                </div>
              )}
            </>
          )}
          <Heading.Group>
            <Heading.Eyebrow>{eyebrow}</Heading.Eyebrow>
            <Heading as="h1" className="mt-0">
              {lesson.title}
            </Heading>
          </Heading.Group>
          {lesson.lead && <Lead>{lesson.lead}</Lead>}
          {lesson.durationMinutes ? (
            <p className="text-sm text-muted-foreground">
              {formatDuration(lesson.durationMinutes, locale)}
            </p>
          ) : null}
        </StoryHeader>

        <StoryBody>
          {lesson.story ? <RenderBlocks blocks={lesson.story} locale={locale} /> : null}
          <LessonPager course={course} previous={previous} next={next} locale={locale} />
        </StoryBody>
      </Story>
    </Container>
  );
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { isEnabled: draft } = await draftMode();
  const params = await paramsPromise;

  const found = await resolveLesson(params, draft);
  if (!found) return {};
  const lesson = await findLesson(found.current.id, params.locale, draft);
  // The page itself answers 404; generateMeta needs a document.
  if (!lesson) return {};

  const website = await getCurrentWebsite();
  const path = getLessonUrl(params.locale, found.course, found.current);
  return generateMeta({ doc: lesson, website, path });
}
