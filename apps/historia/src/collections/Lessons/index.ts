import type { CollectionConfig } from 'payload';
import { admins } from '@/access/admins';
import { authenticated } from '@/access/authenticated';
import { siteEditors } from '@/access/siteRoleAccess';
import { accessOR } from '@/access/utils/accessOR';
import { Content } from '@/blocks/Content/config';
import { Image } from '@/blocks/Image/config';
import { config } from '@/fields/config';
import { image } from '@/fields/image';
import { lead } from '@/fields/lead';
import { publishedAt } from '@/fields/publishedAt';
import resourceId from '@/fields/resourceId';
import { seoTab } from '@/fields/seo';
import { slugField } from '@/fields/slug';
import { storyField } from '@/fields/story';
import { title } from '@/fields/title';

/**
 * One lesson. The content is the `story`; a video is a lesson whose story holds
 * a video block. A lesson does not point at a course: a course's `syllabus`
 * places it in a section and orders it, so the same lesson can be used in more
 * than one course. The slug is unique per website, as for the other content;
 * the course route finds the lesson through the course in the URL.
 *
 * Lessons are not readable through the API by visitors. Who may read a lesson
 * is the course's decision (`access` on the course), and a lesson can be in
 * several courses, so the course route is the one door: it checks the course
 * and then reads the lesson itself. People with a role on the website read
 * them in the admin as they do other content.
 *
 * Not registered in the Payload config yet; see `Courses`.
 */
export const Lessons: CollectionConfig = {
  slug: 'lessons',
  access: {
    create: accessOR(admins, siteEditors),
    // Not `authenticatedOrPublished`: see above. The multi-tenant plugin limits
    // signed-in users to the websites they have a role on.
    read: authenticated,
    readVersions: admins,
    update: accessOR(admins, siteEditors),
    delete: admins,
  },
  admin: {
    defaultColumns: ['title', 'durationMinutes', 'updatedAt'],
    group: 'Courses',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'durationMinutes',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        step: 1,
        description: 'About how long the lesson takes, in minutes.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [title, lead, image, storyField([Content, Image])],
        },
        {
          label: 'Used in',
          description:
            'The courses this lesson is part of. A change here shows in every one of them.',
          fields: [
            {
              name: 'courses',
              label: 'Courses',
              type: 'join',
              // @ts-expect-error - not a CollectionSlug until Courses is registered in the config
              collection: 'courses',
              on: 'syllabus.items',
              admin: {
                allowCreate: false,
                defaultColumns: ['title', '_status', 'updatedAt'],
              },
            },
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
