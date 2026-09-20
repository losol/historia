/**
 * TypeScript types for SEO meta fields
 */

/**
 * Minimal structural shape of a Payload upload document.
 *
 * Used as the default media type so the package stays independent of any
 * app's generated `payload-types`. Apps that want exact typing can pass their
 * own generated `Media` type as the type argument, e.g. `SEODocument<Media>`.
 */
export interface SEOMedia {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: Record<
    string,
    | {
        url?: string | null;
        width?: number | null;
        height?: number | null;
      }
    | null
    | undefined
  > | null;
}

/**
 * SEO meta fields structure
 */
export interface SEOFields<TMedia = SEOMedia> {
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: string | TMedia | null;
  };
}

/**
 * Configuration options for SEO fields
 */
export interface SEOConfig {
  /**
   * Locale for tab labels
   */
  locale?: 'en' | 'no';
}

/**
 * Image field structure used by Payload (with media and caption)
 */
export interface ImageField<TMedia = SEOMedia> {
  media?: string | TMedia | null;
  caption?: unknown;
}

/**
 * Document with SEO fields and common content fields
 */
export interface SEODocument<TMedia = SEOMedia> extends SEOFields<TMedia> {
  title?: string | null;
  slug?: string | null;
  resourceId?: string | null;
  locale?: string | null;
  image?: string | TMedia | ImageField<TMedia> | null;
  featuredImage?: string | TMedia | null;
  lead?: string | null;
  excerpt?: string | null;
}
