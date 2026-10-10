import type { CollectionConfig } from 'payload';
import { publishedAt } from '@/fields/publishedAt';
import { relatedContent } from '@/fields/relatedContent';
import resourceId from '@/fields/resourceId';
import { richText } from '@/fields/richText';
import { seoTab } from '@/fields/seo';
import { slugField } from '@/fields/slug';
import { title } from '@/fields/title';
import { topics } from '@/fields/topics';
import { revalidateSitemap, revalidateSitemapAfterDelete } from '@/hooks/revalidateSitemap';
import { generatePreviewPath } from '@/utilities/generatePreviewPath';
import { admins } from '../access/admins';
import { anyone } from '../access/anyone';
import { siteEditors } from '../access/siteRoleAccess';
import { siteScoped } from '../access/siteScoped';
import { accessOR } from '../access/utils/accessOR';
import { image } from '../fields/image';

export const Notes: CollectionConfig = {
  slug: 'notes',
  admin: {
    useAsTitle: 'title',
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          resourceId: typeof data?.resourceId === 'string' ? data.resourceId : undefined,
          collection: 'notes',
          req,
        });

        return path;
      },
    },
    preview: (data, { req }) => {
      const path = generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        resourceId: typeof data?.resourceId === 'string' ? data.resourceId : undefined,
        collection: 'notes',
        req,
      });

      return path;
    },
  },
  access: {
    read: siteScoped(anyone),
    create: accessOR(admins, siteEditors),
    update: accessOR(admins, siteEditors),
    delete: admins,
  },
  hooks: {
    afterChange: [revalidateSitemap],
    afterDelete: [revalidateSitemapAfterDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            title,
            image,
            richText({ name: 'content', localized: true }),
            topics,
            relatedContent,
            publishedAt,
          ],
        },
        {
          label: 'Meta',
          fields: [...slugField(), resourceId],
        },
        seoTab(),
      ],
    },
  ],
};
