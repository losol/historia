# Role-Based Access Control (RBAC) - Administrator Guide

**Last Updated:** 2026-01-17
**Version:** Historia CMS v3.x (Payload CMS 3.69+)
**Architecture Decision:** See [ADR 0001](../adr/0001-site-editor-role.md)

---

## Overview

Historia uses a **role-based access control (RBAC)** system to manage what users can do on different websites (tenants). Each user can have different roles on different websites, allowing fine-grained control over permissions.

### Role Types

**Global Roles** (apply across all websites):
- `system-admin` — Full system access (the only global role)

**Site Roles** (apply per website/tenant):
- `admin` — Full control of the website
- `editor` — Content creation and editing
- `commerce` — Product and order management
- `member` — Read-only access

**Important:** As of v3.x, only `system-admin` exists as a global role. All other access must be granted through site-specific roles assigned per website.

---

## Site Roles Explained

### 👑 Admin
**Full control of the website/tenant**

**Can do:**
- ✅ Create, edit, delete all content (articles, pages, products, etc.)
- ✅ Manage products and view orders
- ✅ Upload and delete media
- ✅ Update organization details
- ✅ Manage website settings (limited - cannot delete website)

**Cannot do:**
- ❌ Create or delete websites (global admins only)
- ❌ Manage structural elements like topics, places, persons (global admins only)

**Use case:** Website managers, content directors, site owners

---

### ✍️ Editor
**Content creation and editorial work**

**Can do:**
- ✅ Create and edit articles, notes, happenings, cases
- ✅ Upload media (images, documents)
- ✅ Update organization details
- ✅ View and edit drafts
- ✅ View version history

**Cannot do:**
- ❌ Delete content (admins only)
- ❌ Delete media (admins only)
- ❌ Create or edit pages (structural, admins only)
- ❌ Manage products or orders
- ❌ Edit topics, places, persons (taxonomy, admins only)

**Use case:** Content writers, journalists, bloggers, copywriters

---

### 🛒 Commerce
**E-commerce and store management**

**Can do:**
- ✅ Create and edit products
- ✅ View and update orders
- ✅ Create and update shipments
- ✅ View transactions (read-only)

**Cannot do:**
- ❌ Delete products, orders, or shipments
- ❌ Create or edit content (articles, notes, etc.)
- ❌ Delete transactions
- ❌ Upload or manage media

**Use case:** Store managers, inventory managers, fulfillment staff

---

### 👥 Member
**Read-only access with draft visibility**

**Can do:**
- ✅ View published content
- ✅ View drafts on assigned websites (for collaboration)
- ✅ View own cart and orders

**Cannot do:**
- ❌ Create, edit, or delete anything
- ❌ Upload media
- ❌ View other users' orders

**Use case:** Reviewers, stakeholders, clients with preview access

---

## Assigning Roles to Users

Only a **system admin** can add a user to a website or change their site roles.
A site admin can edit the users of their own websites, but the Tenants field is
read-only for them, as it is for a user editing their own profile: otherwise
either could join any website as its admin.

### In Payload Admin UI

1. Navigate to **Users** collection
2. Select a user to edit
3. Scroll to **Tenants** field (in sidebar)
4. Click **Add Tenant**
5. Select the **Website/Tenant**
6. Select one or more **Site Roles**:
   - `admin` — Full control
   - `editor` — Content editing
   - `commerce` — E-commerce
   - `member` — Read-only
7. Click **Save**

### Multiple Roles

Users can have **multiple roles on the same website**:
- ✅ **Editor + Commerce** — Can write content AND manage products
- ✅ **Editor + Member** — Member is redundant (editor includes member permissions)
- ✅ **Admin + Editor** — Admin includes all permissions, so editor is redundant

**Permissions are additive** — users get the union of all role permissions.

### Different Roles on Different Sites

Example user configuration:
```
Sarah Johnson
  Website A → Admin (full control)
  Website B → Editor + Commerce (content + products)
  Website C → Member (read-only)
```

---

## Detailed Permissions Matrix

### Content Collections

| Collection | Member | Editor | Commerce | Admin | Global Admin |
|------------|--------|--------|----------|-------|--------------|
| **Articles** | Read published | ✅ Create/Edit<br>❌ Delete | Read published | ✅ Full | ✅ Full |
| **Happenings** | Read published | ✅ Create/Edit<br>❌ Delete | Read published | ✅ Full | ✅ Full |
| **Notes** | Read published | ✅ Create/Edit<br>❌ Delete | Read published | ✅ Full | ✅ Full |
| **Cases** | Read published | ✅ Create/Edit<br>❌ Delete | Read published | ✅ Full | ✅ Full |
| **Pages** | Read published | Read published | Read published | ✅ Full | ✅ Full |
| **Media** | Read | ✅ Upload/Edit<br>❌ Delete | Read | ✅ Full | ✅ Full |

### E-commerce Collections

| Collection | Member | Editor | Commerce | Admin | Global Admin |
|------------|--------|--------|----------|-------|--------------|
| **Products** | Read published | Read published | ✅ Create/Edit<br>❌ Delete | ✅ Full | ✅ Full |
| **Carts** | Own cart only | Own cart only | View all | ✅ Full | ✅ Full |
| **Orders** | Own orders | Own orders | ✅ View/Update<br>❌ Delete | ✅ Full | ✅ Full |
| **Shipments** | Own shipments | Own shipments | ✅ Create/Update<br>❌ Delete | ✅ Full | ✅ Full |
| **Transactions** | ❌ No access | ❌ No access | View only | ✅ Full | ✅ Full |

### Structural Collections

| Collection | Member | Editor | Commerce | Admin | Global Admin |
|------------|--------|--------|----------|-------|--------------|
| **Websites** | Read | Read | Read | Update only | ✅ Full |
| **Organizations** | Read | ✅ Update | Read | ✅ Update | ✅ Full |
| **Topics** | Read | Read | Read | ✅ Full | ✅ Full |
| **Places** | Read | Read | Read | ✅ Full | ✅ Full |
| **Persons** | Read | Read | Read | ✅ Full | ✅ Full |

**Legend:**
- ✅ = Has permission
- ❌ = No permission
- "Full" = Create, Read, Update, Delete
- "Read published" = Can only see published content
- "Own X only" = Can only see/edit their own records

---

## Common Use Cases

### Scenario 1: Blog with Multiple Writers
**Setup:**
- Website: `company-blog.com`
- User A: `editor` (writes articles)
- User B: `editor` (writes articles)
- User C: `admin` (manages, publishes, deletes)

**Result:** Writers can create and edit articles, but only admin can delete or publish.

---

### Scenario 2: E-commerce Store with Content Team
**Setup:**
- Website: `online-store.com`
- User A: `editor` (writes product descriptions and blog posts)
- User B: `commerce` (manages products and orders)
- User C: `editor` + `commerce` (content + store management)
- User D: `admin` (full control)

**Result:** Clear separation between content and commerce, with option to combine roles.

---

### Scenario 3: Multi-Site Agency
**Setup:**
- User (Agency Manager):
  - `client-a.com` → `admin`
  - `client-b.com` → `admin`
  - `client-c.com` → `admin`
- User (Freelance Writer):
  - `client-a.com` → `editor`
  - `client-b.com` → `editor`
- User (Client):
  - `client-a.com` → `member` (preview access)

**Result:** Agency manager controls all sites, writer edits for two, client previews own site.

---

## Troubleshooting

### "User cannot see website in admin UI"
**Cause:** User is not assigned to the website's tenants.
**Solution:** Add user to website in **Tenants** field with appropriate role.

---

### "Editor cannot delete content"
**Cause:** Only admins and global admins can delete.
**Solution:** This is by design. Assign `admin` role if deletion is required.

---

### "User can see drafts from other websites"
**Cause:** User may have global `admin` role.
**Solution:** This is expected for global admins. Site-specific roles are scoped to their websites.

---

### "Commerce user cannot edit articles"
**Cause:** Commerce role is for products/orders, not content.
**Solution:** Assign both `commerce` and `editor` roles if user needs both permissions.

---

## Security Best Practices

1. **Principle of Least Privilege:** Only assign roles users actually need
2. **Regular Audits:** Review user roles quarterly
3. **Separate Concerns:** Use `editor` and `commerce` roles separately unless user truly needs both
4. **Admin Sparingly:** Only assign `admin` to trusted website managers
5. **Global Admin Rarely:** `system-admin` and global `admin` should be very limited

---

## Technical Details

For technical implementation details, see:
- [ADR 0001: Site Roles and Access Control](../adr/0001-site-editor-role.md)
- [Payload CMS Access Control Documentation](https://payloadcms.com/docs/access-control/overview)
- [Payload Multi-Tenant Plugin](https://payloadcms.com/docs/plugins/multi-tenant)
