# ADR 0012 — Courses and Lessons: an LMS in Historia

## Status

Proposed. The data model below is in the code but not registered in the Payload
config; everything after "The road from here" is a plan, not a decision.

## Context

Doctors are to make courses in Historia, small ones and large ones, and
colleagues are to take them at their own pace. The authors are clinicians, not
editors: they write a course between other things, and whatever takes more than
one screen to explain will not be used.

What is already here:

- Content collections with a shared shape (title, lead, image, `story` blocks,
  drafts with autosave), and an editor the organisation already knows.
- Members: people can log in without getting the admin (#223), and a login
  comes back to the page it started from.
- Eventuras, where events of type `onlineCourse` take registrations, and
  `externalEvent`, which ties a document here to an event there by uuid.
- Commerce: products, orders and Vipps.

What is not here: enrolment, progress, tests, certificates, and any frontend for
courses.

## Principles

1. **A course is one document.** The smallest course is a title and a story,
   published with one button.
2. **A course grows; it does not change kind.** A small course becomes a large
   one by adding lessons, not by starting over in another tool.
3. **The author stays on the course.** Lessons are made from the course page,
   not by travelling to another list and back.
4. **One editor.** A lesson is edited like an article. A new kind of content is
   a new block in that editor, not a new kind of document.
5. **The course is the door.** Who may read a lesson is the course's decision,
   and readers reach lessons through the course.

## Decision: the model

### `courses`

| Field                                            | What it is                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `title`, `lead`, `image`                         | As on other content.                                                   |
| `story`                                          | The course itself in a small course; the front page of a larger one.   |
| `syllabus`                                       | Sections in order. Empty in a small course.                            |
| `access`                                         | `public` (default) or `enrolled`. Stored now, enforced with enrolment. |
| `durationMinutes`                                | Optional. Empty means the sum of the lessons.                          |
| `contributors`, `topics`                         | Instructors and subjects.                                              |
| `externalEvent`                                  | The Eventuras `onlineCourse` event, by uuid.                           |
| slug, `publishedAt`, `resourceId`, `config`, SEO | As on other content.                                                   |

### `syllabus` (an array on the course)

| Field   | What it is                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------- |
| `title` | Optional. One section without a title is a course without parts.                                          |
| `items` | The steps of the section, in order: a polymorphic `hasMany` relationship. Today it allows `lessons` only. |

### `lessons`

| Field                                            | What it is                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `title`, `lead`, `image`, `story`                | As on other content. A video is a lesson with a video block in its story. |
| `durationMinutes`                                | About how long it takes.                                                  |
| `courses`                                        | A join: the courses whose syllabus holds this lesson. Read-only.          |
| slug, `publishedAt`, `resourceId`, `config`, SEO | As on other content.                                                      |

### Why it is shaped this way

- **A lesson does not point at a course.** The syllabus says which lessons a
  course has, so the same lesson can be used in several courses. The `courses`
  join shows an author where a lesson is used before they change it.
- **The syllabus is an array, not blocks.** There is one kind of section, and a
  join field follows a relationship through an array but not through blocks:
  with blocks, the join on lessons made every query on lessons fail in the
  Drizzle adapter (Payload 3.92). An array also has no `blockName`, which showed
  as a second, unexplained "Untitled" beside the section's own title.
- **`items` is polymorphic from the start.** Another kind of step is another
  slug in `relationTo`. Making a single-collection relationship polymorphic
  after the first migration is a data conversion; having it so from the start
  costs nothing.
- **Lessons are closed to visitors in the API** (`read: authenticated`, which
  the multi-tenant plugin narrows to people with a role on the website). A
  lesson can be in a public course and an enrolled one, so no rule on the lesson
  itself can say who may read it. The course route checks the course and then
  reads the lesson with the Local API. Opening this later is easy; closing it
  after people have built on it is not.

### Verified in the running admin

With the collections registered locally (SQLite, not committed):

- A small course is one document: title, lead, a Content block, Publish.
- In a larger course, "Add Section", then the **+** beside Steps opens a lesson
  in a drawer. Three lessons were made without leaving the course, and they
  land in the section in order.
- A lesson's "Used in" tab lists the course and its status.
- A visitor on the site's own domain gets published courses from the API, with
  the lessons as ids only, and 403 from `/api/lessons`.

## What is not easy yet

Found in the same run, and the first things to fix when the collections are
registered:

1. **Publishing a course does not publish its lessons.** Each lesson is its own
   draft, so a course with ten lessons takes eleven publishes, and a published
   course can point at lessons no reader can see. Proposed: publishing a course
   also publishes the lessons in its syllabus that have never been published,
   and the course page shows which lessons have unpublished changes with one
   button to publish them. Changes to an already published lesson are not
   pushed out silently, since the lesson may be in someone else's course.
2. **A section's row reads "Section 01".** A row label that shows the title and
   the number of lessons needs a small client component.
3. **There is no video block.** It is the first block doctors will ask for.
4. **No preview.** The frontend routes come first; live preview follows the
   pattern on Instructions.
5. **Authors need the `editor` role**, which opens all content on the website.
   Whether courses want a narrower role is an open question below.

## The road from here

Each step can ship by itself.

### 1. Open courses

Register the two collections (and add them to the multi-tenant plugin's
`collections`, or publishing fails on "Assigned Tenant"), with the migration.
Routes `courses/[course]` and `courses/[course]/[lesson]`, with a rewrite from
`/no/kurs`. The course page shows the story, then the syllabus with durations; a
lesson page shows the story with previous and next from the syllabus. A course
without a syllabus is one page. A video block. The publishing help above.
Courses go in the search index; lessons do not.

### 2. Members and progress

A login link with `returnTo`. Two collections:

- `enrollments`: user, course, `source` (`self`, `eventuras`, `order`,
  `manual`), enrolled and completed dates. "Start the course" makes one for a
  public course. It is what "My courses" lists and what access checks read.
- `progress`: one row per user and lesson, with when it was completed and, for a
  test, the score and the number of attempts. Keyed by lesson, with the course
  as context only, so a lesson finished in one course is finished in every
  course that uses it. Shaped so each change can also be sent as an xAPI
  statement (actor, verb, object, timestamp) if a record store is ever wanted;
  the rows are what the pages read.

Both hold personal data about named professionals: readable by the person
themself and by admins of the website, never by other members, and deleted with
the user.

### 3. Checks and completion

A `question` block for the lesson story: the question, the alternatives, which
are right, and an explanation shown after answering. That is a knowledge check,
and writing one is adding a block.

A test is then a lesson with a pass mark: `completion` on the lesson, `viewed`
(default) or `passed` with a percentage. Answers are graded on the server, and
the right alternatives are not sent to the browser before the answer.

This replaces the earlier plan of a `quizzes` collection as a step of its own.
A separate collection would give authors a second editor and a second list for
something that is, to them, "a lesson with questions". `items` stays
polymorphic for the day something truly is another kind of document, such as a
bank of questions drawn at random.

A course is complete when every step in its syllabus is.

### 4. Closed courses, Eventuras and certificates

Enforce `access: enrolled`: the course page and syllabus stay public, the
lessons need an enrolment. Enrolments come from an Eventuras registration for
the course's `externalEvent`, or from a paid order here. Completion is reported
back so the certificate can be issued where registrations live.

## Open questions

1. **Publishing together.** Is "publishing a course publishes its unpublished
   lessons" the right rule, or should it always be an explicit button?
2. **Who may author.** The `editor` role, or a narrower one for courses only?
3. **How Historia learns of an Eventuras registration.** Asking Eventuras when a
   member opens a closed course (by the identity both share), or Eventuras
   telling Historia when someone registers.
4. **Where videos live.** Uploaded to the media library, or embedded from a
   video host. It decides what the video block stores.
5. **Certificates.** Issued by Eventuras from a reported completion, or by
   Historia.
6. **A forum.** A discussion attached to a course or a lesson, in its own
   collection. Not a step in the syllabus, and not needed for any step above.

## Consequences

- A doctor can make a small course without learning what a lesson is, and a
  large one without leaving the course page.
- Lessons are reusable, at the cost of one more thing to think about when
  editing a shared lesson; the "Used in" tab is there for that.
- Lessons are not available through the public API or the SDK. Anything that
  wants lesson content goes through the course route.
- Nothing here needs a schema change on courses or lessons when enrolment comes:
  `access` and `externalEvent` are already stored.
