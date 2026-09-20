/**
 * Payload SEO
 *
 * Reusable SEO meta fields for Payload CMS collections. A simple,
 * framework-agnostic approach to managing SEO metadata without the
 * overhead of external plugins.
 *
 * ## Usage
 *
 * ### Add SEO tab to a collection
 *
 * ```typescript
 * import { seoTab } from '@eventuras/payload-seo';
 *
 * export const Articles: CollectionConfig = {
 *   slug: 'articles',
 *   fields: [
 *     // ... other fields
 *     seoTab(),
 *   ],
 * };
 * ```
 *
 * ### Add meta fields inline (without tab)
 *
 * ```typescript
 * import { metaField } from '@eventuras/payload-seo';
 *
 * export const MyCollection: CollectionConfig = {
 *   slug: 'my-collection',
 *   fields: [
 *     // ... other fields
 *     metaField,
 *   ],
 * };
 * ```
 *
 * ## Features
 *
 * - **Title** (max 60 chars) - Optimized for search results
 * - **Description** (max 160 chars) - Snippet text
 * - **Image** - Social sharing image (socialShare format recommended)
 * - **Localized** - Title and description support i18n
 * - **Fallbacks** - Empty fields auto-generate from content
 */

export { metaField, seoTab } from './fields';
export type { ImageField, SEOConfig, SEODocument, SEOFields, SEOMedia } from './types';
