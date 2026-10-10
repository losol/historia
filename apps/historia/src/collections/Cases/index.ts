import type { CollectionConfig } from 'payload';
import { admins } from '@/access/admins';
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished';
import { siteEditors } from '@/access/siteRoleAccess';
import { siteScoped } from '@/access/siteScoped';
import { accessOR } from '@/access/utils/accessOR';
import { endDate } from '@/fields/endDate';
import { image } from '@/fields/image';
import { lead } from '@/fields/lead';
import { partners } from '@/fields/partners';
import { publishedAt } from '@/fields/publishedAt';
import resourceId from '@/fields/resourceId';
import { seoTab } from '@/fields/seo';
import { slugField } from '@/fields/slug';
import { startDate } from '@/fields/startDate';
import { storyField } from '@/fields/story';
import { title } from '@/fields/title';
import { revalidateSitemap, revalidateSitemapAfterDelete } from '@/hooks/revalidateSitemap';
import { populatePublishedAt } from '../../hooks/populatePublishedAt';

export const Cases: CollectionConfig<'cases'> = {
  slug: 'cases',
  access: {
    create: accessOR(admins, siteEditors),
    read: siteScoped(authenticatedOrPublished),
    readVersions: admins,
    update: accessOR(admins, siteEditors),
    delete: admins,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [title, lead, image, storyField(), startDate, endDate, partners],
        },
        {
          label: 'Meta',
          fields: [...slugField(), resourceId, publishedAt],
        },
        seoTab(),
      ],
    },
  ],
  defaultPopulate: {
    title: true,
    slug: true,
  },
  hooks: {
    afterChange: [revalidateSitemap],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateSitemapAfterDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 1000,
      },
    },
  },
};
