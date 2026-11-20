import { Heading } from '@eventuras/ratio-ui/core/Heading';
import { Link as RatioLink } from '@eventuras/ratio-ui-next';
import Link from 'next/link';
import { courseLabels, formatDuration } from '@/lib/courses/labels';
import { courseOutline, lessonsOpen } from '@/lib/courses/queries';
import { type CourseStep, courseDuration } from '@/lib/courses/syllabus';
import { getCourseUrl, getLessonUrl } from '@/lib/courses/urls';
import type { Course } from '@/payload-types';
import styles from './Course.module.css';

type CourseProps = {
  course: Course;
  locale: string;
  /** A preview: drafts of the lessons, and the lessons of a closed course. */
  draft: boolean;
};

/**
 * Under the course's title: how many lessons and how long, and the way in. A
 * course without lessons is its story alone, and shows none of this.
 */
export async function CourseIntro({ course, locale, draft }: Readonly<CourseProps>) {
  const { steps } = await courseOutline(course, locale, draft);
  if (steps.length === 0) return null;

  const t = courseLabels(locale);
  const minutes = courseDuration(course.durationMinutes, steps);
  const facts = [t.lessons(steps.length), minutes ? formatDuration(minutes, locale) : null]
    .filter(Boolean)
    .join(' · ');
  const first = steps[0];

  return (
    <div className={styles.intro}>
      {lessonsOpen(course, draft) ? (
        <RatioLink href={getLessonUrl(locale, course, first)} variant="button-primary">
          {t.start}
        </RatioLink>
      ) : (
        <p className={styles.facts}>{t.enrolledOnly}</p>
      )}
      <p className={styles.facts}>{facts}</p>
    </div>
  );
}

/**
 * The syllabus under the course's story: its sections, with their lessons
 * numbered through the whole course. The lessons link to their pages unless
 * the course is for enrolled participants.
 */
export async function CourseSyllabus({ course, locale, draft }: Readonly<CourseProps>) {
  const { sections } = await courseOutline(course, locale, draft);
  if (sections.length === 0) return null;

  const t = courseLabels(locale);
  const open = lessonsOpen(course, draft);
  const headingId = `syllabus-${course.resourceId}`;

  return (
    <section className={styles.syllabus} aria-labelledby={headingId}>
      <Heading as="h2" id={headingId}>
        {t.contents}
      </Heading>
      {sections.map((section) => (
        <div key={section.id} className={styles.section}>
          {section.title && <Heading as="h3">{section.title}</Heading>}
          <ol className={styles.steps} start={section.steps[0]?.number}>
            {section.steps.map((step) => (
              <SyllabusStep
                key={step.id}
                step={step}
                href={open ? getLessonUrl(locale, course, step) : null}
                locale={locale}
              />
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function SyllabusStep({
  step,
  href,
  locale,
}: Readonly<{ step: CourseStep; href: string | null; locale: string }>) {
  return (
    <li className={styles.step}>
      <span className={styles.number} aria-hidden="true">
        {step.number}
      </span>
      {href ? (
        <Link href={href} className={styles.stepTitle}>
          {step.title}
        </Link>
      ) : (
        <span className={styles.stepTitle}>{step.title}</span>
      )}
      {step.durationMinutes ? (
        <span className={styles.duration}>{formatDuration(step.durationMinutes, locale)}</span>
      ) : null}
    </li>
  );
}

/** Previous and next under a lesson; back to the course after the last one. */
export function LessonPager({
  course,
  previous,
  next,
  locale,
}: Readonly<{
  course: Course;
  previous: CourseStep | null;
  next: CourseStep | null;
  locale: string;
}>) {
  const t = courseLabels(locale);
  return (
    <nav className={styles.pager} aria-label={t.lessonNav}>
      {previous && (
        <Link href={getLessonUrl(locale, course, previous)} className={styles.pagerLink} rel="prev">
          <span className={styles.pagerLabel}>← {t.previous}</span>
          <span className={styles.pagerTitle}>{previous.title}</span>
        </Link>
      )}
      {next ? (
        <Link
          href={getLessonUrl(locale, course, next)}
          className={`${styles.pagerLink} ${styles.pagerNext}`}
          rel="next"
        >
          <span className={styles.pagerLabel}>{t.next} →</span>
          <span className={styles.pagerTitle}>{next.title}</span>
        </Link>
      ) : (
        <Link
          href={getCourseUrl(locale, course)}
          className={`${styles.pagerLink} ${styles.pagerNext}`}
        >
          <span className={styles.pagerLabel}>{t.finished}</span>
          <span className={styles.pagerTitle}>{t.backToCourse}</span>
        </Link>
      )}
    </nav>
  );
}
