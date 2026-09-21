import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
} from '@payloadcms/plugin-seo/fields';
import type { Field, Tab } from 'payload';

/**
 * SEO meta fields for Open Graph and social sharing
 *
 * Built from the field factories in `@payloadcms/plugin-seo`, which give the
 * admin UI its character-length indicators. The plugin's overview (checklist)
 * and preview (search snippet) panels are left out on purpose. The plugin
 * itself is registered in `plugins.ts` without any collections, only so these
 * components get their translations.
 *
 * Empty fields fall back to the document's own content; see `lib/seo`.
 */
export const metaField: Field = {
  name: 'meta',
  type: 'group',
  fields: [
    MetaTitleField({ overrides: { label: 'Meta Title', maxLength: 60 } }),
    MetaDescriptionField({ overrides: { label: 'Meta Description', maxLength: 160 } }),
    MetaImageField({ relationTo: 'media', overrides: { label: 'Social Share Image' } }),
  ],
};

/**
 * SEO tab configuration
 *
 * Creates a separate tab in the admin UI for SEO fields, keeping content
 * and SEO concerns cleanly separated. Place it in the `tabs` array of a
 * `{ type: 'tabs' }` field, not directly in a collection's `fields`.
 */
export const seoTab = (): Tab => ({
  label: 'SEO',
  description: 'Optimize how your content appears in search engines and social media',
  fields: [metaField],
});
