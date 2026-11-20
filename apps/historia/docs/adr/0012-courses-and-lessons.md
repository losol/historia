# ADR 0012 — Courses and Lessons: an LMS in Historia

## Status

Accepted for the data model: the two collections are registered in the Payload
config, with the migration `20261115_202548_courses_and_lessons`. They are in
the admin and the API, and on the site under `/{locale}/c/kurs` (see "1. Open
courses"). Everything after "The road from here" is a plan, not a decision,
except what that step records as done.

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

What is not here: enrolment, progress, tests and certificates. When this was
written there was no frontend for courses either; step 1 below added it.

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

### Verified on Postgres

With the migration applied to an empty Postgres database, through the API:

- Sections and the lessons in them keep their order, also after the sections
  are swapped and the lessons of one are reversed.
- A lesson in two courses is in both; the section title is per locale and the
  lessons are the same in every locale.
- A visitor gets published courses only, with the lessons as ids, and 403 from
  `/api/lessons`. So does a signed-in user without a role, who gets 403 from
  `/api/courses` as well, as from the other content.
- A lesson of one website cannot be put in a course of another: the syllabus
  refuses it, for a system admin too.
- A course cannot be published with the same lesson in its syllabus twice.
- In the admin: a course with a section, a lesson made from the **+** in a
  drawer, published.

## What is not easy yet

Found in those runs, and the first things to fix:

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
4. ~~**No preview.**~~ Done with the routes: courses preview as other content
   does, and a lesson previews under the oldest course whose syllabus holds it.
   A lesson in no course has no page, and so no preview.
5. **Authors need the `editor` role**, which opens all content on the website.
   Whether courses want a narrower role is an open question below.
6. **"Used in" is right in the admin only.** Read through the API, the `courses`
   join on a lesson repeats a course once for every section of its syllabus
   (Payload 3.92, Postgres), and its count is wrong with it. The admin lists the
   courses with a query of its own and shows each once. Code that needs the
   courses of a lesson queries courses where `syllabus.items.value` is the
   lesson.
7. **Deleting a lesson takes it out of every course, without a word.** The
   syllabus of a published course loses the step, and so do the course's stored
   versions. Only admins can delete, but nothing warns them.
8. **A lesson in a published course can be unpublished.** The course route
   leaves out the steps a reader cannot see, as for lessons never published:
   they are not in the syllabus, not in previous and next, and their URL is a
   404. A section left empty is left out.
9. **Slugs are not unique.** Two lessons on a website can have the same slug, as
   two articles can. The lesson's URL carries its `resourceId`, as the other
   content does, and the route finds it by that among the lessons of the course
   in the URL. A wrong or old slug redirects to the right one.

## The road from here

Each step can ship by itself.

### 1. Open courses

The two collections are registered, and in the multi-tenant plugin's
`collections` (without that, publishing fails on "Assigned Tenant").

Done:

- **The routes are under `/c/`, as the other content's.** A course is
  `/no/c/kurs/{slug}--{resourceId}` (`/en/c/courses/…`), and a lesson is below
  it: `/no/c/kurs/{course}--{id}/{lesson}--{id}`. The plan was `courses/[course]`
  with a rewrite from `/no/kurs`, but a top-level `kurs` would hide a page with
  that slug on every website, and a website about courses is likely to have
  one. Under `/c/` the list (`/no/c/kurs`), the sitemap, the redirects between
  the languages' names and the preview come with the collection.
- **The course page** shows the story, then the syllabus: the sections with
  their titles, the lessons numbered through the whole course, with their
  durations. Above the story: the number of lessons, the duration (the
  course's own, or the sum of the lessons') and "Start kurset", to the first
  lesson. A course without a syllabus is its story alone.
- **The lesson page** shows where it is ("Leksjon 2 av 5 · section"), the
  story, and previous and next from the syllabus; after the last lesson, back
  to the course. It is found as described under item 9 above, and read with
  the Local API past access control: only lessons of that course's syllabus,
  on this website, published (or their drafts in a preview).
- **`access: enrolled` closes the lessons now.** The course page and its
  syllabus are public, without links, and a lesson's URL is a 404 for
  everyone but an editor's preview. Serving them publicly until enrolment
  exists would open what the author meant to keep closed.
- **Courses are in the search index**, with the migration
  `20261120_175713_courses_in_search` (a column on `search_rels`). Lessons are
  not, and not in the sitemap either: they are reached through the course.

Left from this step: a video block, which waits for open question 4, and the
publishing help (item 1 above), which waits for open question 1.

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
  wants lesson content goes through the course route, which reads them with
  `lib/courses/queries`.
- Nothing here needs a schema change on courses or lessons when enrolment comes:
  `access` and `externalEvent` are already stored.
