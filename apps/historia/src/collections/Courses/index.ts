import type { CollectionConfig } from 'payload';
import { admins } from '@/access/admins';
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished';
import { siteEditors } from '@/access/siteRoleAccess';
import { siteScoped } from '@/access/siteScoped';
import { accessOR } from '@/access/utils/accessOR';
import { Content } from '@/blocks/Content/config';
import { Image } from '@/blocks/Image/config';
import { config } from '@/fields/config';
import { contributors } from '@/fields/contributors';
import { externalEvent } from '@/fields/externalEvent';
import { image } from '@/fields/image';
import { lead } from '@/fields/lead';
import { publishedAt } from '@/fields/publishedAt';
import resourceId from '@/fields/resourceId';
import { seoTab } from '@/fields/seo';
import { slugField } from '@/fields/slug';
import { storyField } from '@/fields/story';
import { title } from '@/fields/title';
import { topics } from '@/fields/topics';
import { syllabus } from './fields/syllabus';

/**
 * A course, small or large, taken at the participant's own pace.
 *
 * A small course is this document alone: the `story` is the course, and the
 * `syllabus` stays empty. A larger one adds lessons in the `syllabus`, in one
 * section or several, and the `story` becomes its front page. Growing from the
 * one to the other is adding a section, not changing kind. Lessons are their
 * own documents and can be used in more than one course.
 *
 * Not registered in the Payload config yet: the model first, the migration
 * when the frontend and access come. Enrolment and progress are separate
 * collections later; `access` is stored now so they need no schema change on
 * the course. See docs/adr/0012-courses-and-lessons.md.
 */
export const Courses: CollectionConfig = {
  slug: 'courses',
  access: {
    create: accessOR(admins, siteEditors),
    read: siteScoped(authenticatedOrPublished),
    readVersions: admins,
    update: accessOR(admins, siteEditors),
    delete: admins,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'access', 'updatedAt'],
    group: 'Courses',
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [title, lead, image, storyField([Content, Image]), syllabus],
        },
        {
          label: 'Details',
          fields: [
            {
              name: 'access',
              type: 'select',
              defaultValue: 'public',
              options: [
                { label: 'Public: anyone can read the lessons', value: 'public' },
                { label: 'Enrolled: only participants of the course', value: 'enrolled' },
              ],
              admin: {
                description:
                  'Who can read the lessons. Enrolment is not enforced yet; the value is kept so it will be.',
              },
            },
            {
              name: 'durationMinutes',
              type: 'number',
              min: 0,
              admin: {
                step: 1,
                description:
                  'About how long the course takes, in minutes. Leave empty to use the sum of the lessons.',
              },
            },
            contributors,
            topics,
            externalEvent,
          ],
        },
        {
          label: 'Meta',
          fields: [publishedAt, ...slugField(), resourceId, config],
        },
        seoTab(),
      ],
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 1000,
      },
    },
  },
};
