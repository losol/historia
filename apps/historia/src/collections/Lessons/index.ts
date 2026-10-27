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
 * One lesson of a course. The content is the `story`; the course's `syllabus`
 * places the lesson in a section and orders it. The slug only has to be unique within
 * the course, so "Introduction" can open every course; the course route will
 * resolve it.
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
    defaultColumns: ['title', 'course', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      // @ts-expect-error - not a CollectionSlug until Courses is registered in the config
      relationTo: 'courses',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
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
