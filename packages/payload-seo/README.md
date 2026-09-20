# @eventuras/payload-seo

Simple, framework-agnostic SEO meta fields for Payload CMS collections.

## Features

- ✅ **Title, Description, Image** - Essential SEO meta fields
- ✅ **Localized** - Full i18n support for title/description
- ✅ **Character limits** - 60 chars for title, 160 for description
- ✅ **Smart fallbacks** - Empty fields auto-generate from content
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Tab UI** - Clean separation in admin panel
- ✅ **Zero runtime dependencies** - `payload` is the only peer

## Usage

### Add SEO Tab to Collection

```typescript
import { seoTab } from '@eventuras/payload-seo';

export const Articles: CollectionConfig = {
  slug: 'articles',
  fields: [
    // ... your content fields
    seoTab(),
  ],
};
```

### Add Meta Fields Inline (No Tab)

```typescript
import { metaField } from '@eventuras/payload-seo';

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    // ... other fields
    metaField, // Adds meta group inline
  ],
};
```

## TypeScript Types

```typescript
import type { SEODocument, SEOFields } from '@eventuras/payload-seo';

// Use in your document interfaces
interface MyDocument extends SEOFields {
  title: string;
  // ... other fields
}
```

The types are generic over the media type. By default they use `SEOMedia`, a
minimal structural shape that any Payload upload document satisfies, so the
package stays independent of a host app's generated `payload-types`. Pass your
own generated type when you want exact typing:

```typescript
import type { SEODocument } from '@eventuras/payload-seo';
import type { Media } from '@/payload-types';

const doc: SEODocument<Media> = {
  title: 'My Article',
  meta: {
    title: 'Custom SEO Title',
    description: 'Custom description',
    image: mediaObject,
  },
};
```

## Field Structure

```typescript
{
  meta: {
    title: string;        // Max 60 chars, localized
    description: string;  // Max 160 chars, localized
    image: Media;         // Upload relation to 'media' collection
  }
}
```

## Best Practices

### Image Formats

Use the **socialShare** format (1200×630px) for optimal social media display:

```typescript
// In your Next.js metadata generation
const imageUrl =
  doc.meta?.image?.sizes?.socialShare?.url ||  // Optimal format
  doc.meta?.image?.sizes?.landscape?.url ||    // Fallback
  doc.meta?.image?.url;                        // Original
```

### Fallback Chain

Recommended fallback order in `generateMetadata`:

1. **doc.meta.title** → Custom SEO title
2. **doc.title** → Content title
3. **website.meta.title** → Site-wide default

Same for description and image.

## Requirements

The `image` field is an upload relation to a collection with the slug `media`.
The host app must define that collection.

## Possible Enhancements

Character counters, auto-generate hooks, and robots fields.
