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

/**
 * A course: an ordered set of lessons a participant goes through at their own
 * pace. The course page is the `story`; the lessons are their own documents,
 * joined here by `lessons.course` and ordered from this side.
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
              name: 'lessons',
              type: 'join',
              // @ts-expect-error - not a CollectionSlug until Lessons is registered in the config
              collection: 'lessons',
              on: 'course',
              orderable: true,
              admin: {
                description: 'The lessons in the order participants take them.',
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
