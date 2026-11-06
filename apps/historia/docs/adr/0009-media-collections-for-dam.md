# ADR 0009 — Media Collections for Digital Asset Management

## Status

Accepted (Implemented)

## Context

Historia's Media collection currently stores all uploaded files in a flat structure. As the media library grows, users need better organization and the ability to share media assets across different tenants (websites) in a shared Digital Asset Management (DAM) system.

### Current Limitations

Without media organization:

- ❌ All media files in one flat list (hard to browse)
- ❌ No way to group related media (e.g., "Product Photos 2025", "Event Assets")
- ❌ No cross-tenant media sharing capabilities
- ❌ Difficult to find specific images as library grows
- ❌ No hierarchical organization (folders/subfolders)

### Requirements

**Organization:**
- Group media into named collections
- Support hierarchical structure (collection can have parent collection)
- Descriptive metadata per collection
- Backward compatible (existing uncategorized media still works)

**Multi-Tenancy & Sharing:**
- Collections can specify allowed tenants (ACL)
- Media in a collection inherits access rules
- Support shared media across multiple websites/tenants
- Admin override for managing all collections

**User Experience:**
- Filter media by collection in admin UI
- Browse hierarchical collection structure
- Keep existing media outside collections (uncategorized)

**Future Considerations:**
- Access control implementation (deferred to later phase)
- Advanced DAM features (tags, metadata fields)
- Collection templates or presets

## Decision

Implement a **Media Collections** collection (slug: `media-collections`) to organize media assets with optional hierarchical structure and prepare for multi-tenant DAM capabilities.

### Architecture Overview

```
┌──────────────────┐
│    Websites      │
│   (tenants)      │
└────────┬─────────┘
         │
         │ allowedTenants (future ACL)
         │
         ▼
┌──────────────────────┐
│ Media Collections    │◄──┐ parentCollection
│  - name              │   │ (optional hierarchy)
│  - description       │   │
│  - parent (optional) │───┘
│  - allowedTenants    │
└────────┬─────────────┘
         │
         │ collection (optional)
         │
         ▼
┌──────────────────────┐
│       Media          │
│  - title             │
│  - file upload       │
│  - collection ref    │
└──────────────────────┘
```

### Schema Design

**Media Collections Collection:**

```typescript
{
  slug: 'media-collections',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parentCollection', 'updatedAt'],
    group: 'Content Management',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      // e.g., "Product Photos", "Marketing Assets", "Event 2025"
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      // What this collection is for
    },
    ...slugField(), // Auto-generated from name
    {
      name: 'parentCollection',
      type: 'relationship',
      relationTo: 'media-collections',
      // Optional nesting: "Marketing > Social Media > 2025"
    },
  ],
}
```

**Media Collection Update:**

```typescript
{
  slug: 'media',
  fields: [
    // ... existing fields ...
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'media-collections',
      hasMany: true, // Media can belong to multiple collections
      // Optional: media without collections = uncategorized
    },
  ],
}
```

### Key Decisions

**1. Optional Collection Field**

- **Decision:** Media `collection` field is optional
- **Rationale:**
  - Backward compatible with existing media
  - Users can gradually organize media
  - Uncategorized media still fully functional
  - No forced migration needed

**2. Hierarchical Structure**

- **Decision:** Collections can have a `parentCollection` (optional)
- **Rationale:**
  - Enables folder-like organization: "Marketing > Social > 2025"
  - Single optional field keeps it simple
  - Users can start flat and add hierarchy later
  - Not recursive (no infinite nesting UI complexity for MVP)

**3. Localized Collection Names**

- **Decision:** Collection `name` and `description` are localized
- **Rationale:**
  - Multi-language CMS should support localized folder names
  - "Produktbilder" (no) vs "Product Photos" (en)
  - Consistent with other Historia collections

**4. Access Control (Deferred to Phase 2)**

- **Decision:** Defer multi-tenant ACL implementation to Phase 2
- **Rationale:**
  - Current focus: organization, not security
  - Access logic needs careful design (separate ADR)
  - Phase 1 uses standard admin/siteEditor access control
  - Can add `allowedTenants` field later without migration

**Phase 1 Access Control:**
- Collections: read=anyone, create/update=admins, delete=admins
- Media: existing access rules unchanged
- Collections are organizational metadata, not security boundaries

**5. Many-to-Many Collections**

- **Decision:** Media can belong to multiple collections (`hasMany: true`)
- **Rationale:**
  - Standard DAM pattern - most DAM systems support this
  - Same asset can be in "Product Photos" AND "Marketing Assets"
  - Reduces duplication - no need to upload same file multiple times
  - Better for cross-functional teams
  - More flexible than folder-based organization

**6. Slug Field**

- **Decision:** Collections have auto-generated slugs
- **Rationale:**
  - Future-proof for API endpoints and public collection pages
  - URL-friendly filtering in admin
  - Cheap to add now, expensive to migrate later
  - Consistent with other Historia collections

**7. No Cascade Delete**

- **Decision:** Deleting a collection doesn't delete media
- **Rationale:**
  - Media is primary data (preserve it)
  - Deleting a collection unlinks media (makes it uncategorized)
  - Safer than accidental bulk media deletion
  - Payload default behavior

### Migration Strategy

**Phase 1 (This ADR - Implemented):**
1. Create `media-collections` collection
2. Add optional `collection` field to Media (hasMany: true)
3. Generate migration with new schema
4. All existing media: `collection: []` (uncategorized)

**Phase 2 (Future ADR):**
- Add `allowedTenants` field to MediaCollections
- Implement access control based on `allowedTenants`
- Define empty tenant behavior
- Update read access logic for Media
- Document access control rules

### Admin UI Considerations

**Media Collection Management:**
- List view shows hierarchy (parent collection)
- Filter media by collection in Media admin
- Collection selector when uploading media
- Show collection name in Media list view (if set)

**Future Enhancements:**
- Breadcrumb navigation for hierarchy
- Collection tree view
- Drag-and-drop to move media between collections
- Bulk assign media to collection

## Consequences

### Positive

✅ **Better organization** — Users can group related media
✅ **Scalable** — Hierarchical structure supports growth
✅ **Backward compatible** — No breaking changes to existing media
✅ **Future-ready** — Schema supports multi-tenant DAM
✅ **Flexible** — Collections optional, hierarchy optional
✅ **Simple MVP** — Defer complex ACL logic to Phase 2

### Negative

⚠️ **Additional complexity** — New collection to manage
⚠️ **ACL deferred** — Access control not implemented yet
⚠️ **Manual organization** — Users must assign media to collections manually
⚠️ **Hierarchy complexity** — Deep nesting could become unwieldy (mitigated by validation)

### Neutral

🔸 **Uncategorized media** — Valid use case, not a problem
🔸 **Hierarchy depth** — No technical limit (could be UX issue if too deep)
🔸 **Tenant relationship** — Prepared but not enforced

## Alternatives Considered

### 1. Simple Category Enum

```typescript
{
  name: 'category',
  type: 'select',
  options: ['photos', 'documents', 'videos', 'marketing']
}
```

**Rejected:**
- ❌ Not flexible (predefined categories)
- ❌ No hierarchy support
- ❌ No per-category ACL
- ❌ Can't add custom categories per tenant

### 2. Use Existing Topics Collection

**Rejected:**
- ❌ Topics are for content categorization (semantic)
- ❌ Media Collections are organizational (structural)
- ❌ Different access control needs
- ❌ Mixing concerns

### 3. Filesystem-Based Folders

Store media in actual filesystem folders like `public/media/marketing/social/`

**Rejected:**
- ❌ Hard to manage ACL per folder
- ❌ Difficult to move media between folders
- ❌ No metadata or localization
- ❌ Path-based URLs break on reorganization
- ✅ Current flat upload directory is simpler

### 4. Tags Instead of Collections

Many-to-many tags instead of single collection

**Rejected for MVP:**
- ⚠️ More complex UI (multiple tags)
- ⚠️ Harder to browse hierarchically
- ⚠️ ACL becomes complex (tag intersection logic)
- ✅ Could add tags later in addition to collections

## Implementation Notes

### Database Migration

Generated migration will:
1. Create `media_collections` table
2. Add `media.collection_id` column (nullable)
3. No data migration needed (existing media has `null`)

### Circular Reference Prevention

**Critical:** Prevent collections from becoming their own parent (directly or through chain).

```typescript
// collections/MediaCollections.ts
import type { CollectionConfig } from 'payload';

export const MediaCollections: CollectionConfig = {
  slug: 'media-collections',
  // ... other config ...
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, originalDoc }) => {
        // Only check when updating or creating with parent
        if (!data?.parentCollection) return data;

        // Prevent self-reference
        if (originalDoc?.id && data.parentCollection === originalDoc.id) {
          throw new Error('A collection cannot be its own parent');
        }

        // Prevent circular references in chain
        const checkCircular = async (
          parentId: string,
          visitedIds = new Set<string>([originalDoc?.id]),
        ): Promise<boolean> => {
          // If we've seen this ID before, we have a cycle
          if (visitedIds.has(parentId)) return true;
          visitedIds.add(parentId);

          try {
            const parent = await req.payload.findByID({
              collection: 'media-collections',
              id: parentId,
              depth: 0, // Don't need deep data
            });

            // No parent = end of chain, no cycle
            if (!parent?.parentCollection) return false;

            // Check parent's parent recursively
            return checkCircular(
              typeof parent.parentCollection === 'string'
                ? parent.parentCollection
                : parent.parentCollection.id,
              visitedIds,
            );
          } catch (error) {
            // Parent not found = broken reference but not circular
            return false;
          }
        };

        const hasCircular = await checkCircular(
          typeof data.parentCollection === 'string'
            ? data.parentCollection
            : data.parentCollection.id,
        );

        if (hasCircular) {
          throw new Error(
            'Cannot create circular parent-child relationship. ' +
              'This collection is already an ancestor of the selected parent.',
          );
        }

        return data;
      },
    ],
  },
};
```

**How it works:**
1. On save, check if `parentCollection` is set
2. Traverse parent chain, tracking visited IDs
3. If we encounter current collection ID → circular reference detected
4. Throw validation error before saving

**Edge cases handled:**
- Direct self-reference (A → A)
- Two-level cycle (A → B → A)
- Deep chain cycle (A → B → C → A)
- Broken references (parent doesn't exist) = allowed

### Payload Configuration

```typescript
// payload.config.ts
import { MediaCollections } from './collections/MediaCollections';
import { Media } from './collections/Media';

export default buildConfig({
  collections: [
    // ... existing collections ...
    Media, // Updated with collection field
    MediaCollections, // New collection
    // ... other collections ...
  ],
});
```

### Access Control (Future)

```typescript
// Future Phase 2 implementation sketch
{
  slug: 'media',
  access: {
    read: async ({ req, data }) => {
      if (req.user?.roles?.includes('admin')) return true;

      // If media has no collection, use existing rules
      if (!data.collection) {
        return existingReadAccess({ req, data });
      }

      // If media has collection, check allowedTenants
      const collection = await req.payload.findByID({
        collection: 'media-collections',
        id: data.collection,
      });

      // Check if user's tenant is in allowedTenants
      return collection.allowedTenants?.includes(req.user.tenant);
    },
  },
}
```

## References

- [Payload Uploads Documentation](https://payloadcms.com/docs/upload/overview)
- [Payload Relationship Fields](https://payloadcms.com/docs/fields/relationship)
- [ADR 0001 — Site Editor Role](./0001-site-editor-role.md) (access control patterns)
- [ADR 0003 — User Field Access Control](./0003-user-field-access-control.md) (field-level access)

## Future Work

### Phase 2: Access Control

- Implement read access logic based on `allowedTenants`
- Define behavior for empty `allowedTenants`
- Add admin UI indicators for access rules
- Document cross-tenant sharing workflows
- Create ADR for ACL implementation details

### Phase 3: Enhanced DAM Features

- Metadata templates per collection
- Collection-level default licenses
- Bulk operations (move, tag, delete)
- Collection usage statistics
- Media approval workflows
- Version history for media

### Phase 4: Advanced Organization

- Tags in addition to collections (many-to-many)
- Smart collections (auto-organize by rules)
- Collection templates
- Import/export collection structures
