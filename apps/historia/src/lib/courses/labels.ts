/**
 * The words of the course pages, in the site's languages. Norwegian is the
 * site's own language; any other locale gets English.
 */
const labels = {
  no: {
    contents: 'Innhold',
    start: 'Start kurset',
    previous: 'Forrige',
    next: 'Neste',
    backToCourse: 'Tilbake til kurset',
    finished: 'Du er ved slutten av kurset.',
    enrolledOnly: 'Leksjonene i dette kurset er for påmeldte deltakere.',
    lessonNav: 'Leksjoner',
    breadcrumbs: 'Brødsmuler',
    lesson: (number: number, total: number) => `Leksjon ${number} av ${total}`,
    lessons: (count: number) => (count === 1 ? '1 leksjon' : `${count} leksjoner`),
    hours: 't',
  },
  en: {
    contents: 'Contents',
    start: 'Start the course',
    previous: 'Previous',
    next: 'Next',
    backToCourse: 'Back to the course',
    finished: 'You are at the end of the course.',
    enrolledOnly: 'The lessons of this course are for enrolled participants.',
    lessonNav: 'Lessons',
    breadcrumbs: 'Breadcrumbs',
    lesson: (number: number, total: number) => `Lesson ${number} of ${total}`,
    lessons: (count: number) => (count === 1 ? '1 lesson' : `${count} lessons`),
    hours: 'h',
  },
};

export type CourseLabels = (typeof labels)['en'];

export const courseLabels = (locale: string): CourseLabels =>
  locale === 'no' ? labels.no : labels.en;

/** "45 min", "1 t", "1 t 30 min" ("1 h 30 min" in English). */
export function formatDuration(minutes: number, locale: string): string {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  const h = `${hours} ${courseLabels(locale).hours}`;
  return rest === 0 ? h : `${h} ${rest} min`;
}
