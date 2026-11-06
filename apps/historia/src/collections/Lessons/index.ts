import type { CollectionConfig } from 'payload';
import { admins } from '@/access/admins';
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished';
import { siteEditors } from '@/access/siteRoleAccess';
import { siteScoped } from '@/access/siteScoped';
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
 * Not registered in the Payload config yet; see `Courses`.
 */
export const Lessons: CollectionConfig = {
  slug: 'lessons',
  access: {
    create: accessOR(admins, siteEditors),
    read: siteScoped(authenticatedOrPublished),
    readVersions: admins,
    update: accessOR(admins, siteEditors),
    delete: admins,
  },
  admin: {
    defaultColumns: ['title', 'durationMinutes', 'updatedAt'],
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
