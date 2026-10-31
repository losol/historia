import type { CollectionConfig } from 'payload';
import { admins } from '@/access/admins';
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished';
import { siteEditors } from '@/access/siteRoleAccess';
import { siteScoped } from '@/access/siteScoped';
import { accessOR } from '@/access/utils/accessOR';
import { Content } from '@/blocks/Content/config';
import { CourseSection } from '@/blocks/CourseSection/config';
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

/**
 * A course: lessons in sections, taken at the participant's own pace. The
 * course page is the `story`; the `syllabus` orders the lessons, which are
 * their own documents pointing back at the course.
 *
 * Not registered in the Payload config yet: the model first, the migration
 * when the frontend and access come. Enrolment, progress and quizzes are
 * separate collections later; `access` is stored now so they need no schema
 * change on the course.
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
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            title,
            lead,
            image,
            storyField([Content, Image]),
            {
              name: 'syllabus',
              type: 'blocks',
              blocks: [CourseSection],
              admin: {
                description:
                  'The sections of the course and the lessons in each, in the order participants take them.',
              },
            },
          ],
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
