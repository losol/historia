import { identitiesField } from '@eventuras/payload-oidc-auth';
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields';
import type { CollectionConfig } from 'payload';
import { adminsFieldLevel } from '../../access/admins';
import { isSystemAdmin, systemAdminsFieldLevel } from '../../access/isSystemAdmin';
import { addressFields } from '../../fields/address';
import { createAccess } from './access/create';
import { globalRolesCreateAccess, globalRolesUpdateAccess } from './access/globalRoles';
import { readAccess } from './access/read';
import { updateAndDeleteAccess } from './access/updateAndDelete';
import { createVerifiedFieldAccess, verificationFlagAccess } from './access/verifiedFieldAccess';
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin';
import { protectApiKeyFields } from './hooks/protectApiKeyFields';
import { refusePasswordLogin } from './hooks/refusePasswordLogin';
import { setCookieBasedOnDomain } from './hooks/setCookieBasedOnDomain';

const defaultTenantArrayField = tenantsArrayField({
  tenantsArrayFieldName: 'tenants',
  tenantsArrayTenantFieldName: 'tenant',
  tenantsCollectionSlug: 'websites',
  // Which sites a user belongs to, and with which roles, is granted by a system
  // admin only (ADR 0001). A user may update their own document and a site admin
  // the users of their sites, so an open field would let either of them join any
  // site as its admin. Read stays open: the admin's site switcher needs it.
  arrayFieldAccess: {
    create: systemAdminsFieldLevel,
    update: systemAdminsFieldLevel,
  },
  tenantFieldAccess: {},
  rowFields: [
    {
      name: 'siteRoles',
      type: 'select',
      defaultValue: ['member'],
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Commerce', value: 'commerce' },
        { label: 'Member', value: 'member' },
      ],
      required: true,
      admin: {
        description:
          'Site-specific roles. Users can have multiple roles on a website. Only system admins can assign them.',
      },
    },
  ],
});

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: createAccess,
    delete: () => false,
    read: readAccess,
    update: updateAndDeleteAccess,
  },
  admin: {
    defaultColumns: ['email'],
    useAsTitle: 'email',
  },
  auth: {
    // The identity providers' strategies are added by oidcAuthPlugin (see plugins.ts).
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    useSessions: true,
    useAPIKey: true,
  },
  fields: [
    {
      name: 'enableAPIKey',
      type: 'checkbox',
      access: {
        create: adminsFieldLevel,
        read: adminsFieldLevel,
        update: adminsFieldLevel,
      },
      hooks: {
        beforeChange: [protectApiKeyFields],
      },
      admin: {
        hidden: true, // Managed through API Keys UI tab
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        create: adminsFieldLevel,
        read: adminsFieldLevel,
        update: adminsFieldLevel,
      },
      hooks: {
        beforeChange: [protectApiKeyFields],
      },
      admin: {
        hidden: true, // Managed through API Keys UI tab
      },
    },
    {
      name: 'apiKeyIndex',
      type: 'text',
      access: {
        create: adminsFieldLevel,
        read: adminsFieldLevel,
        update: adminsFieldLevel,
      },
      hooks: {
        beforeChange: [protectApiKeyFields],
      },
      admin: {
        hidden: true, // Managed through API Keys UI tab
      },
    },
    {
      label: 'Name',
      type: 'collapsible',
      fields: [
        {
          name: 'given_name',
          label: 'Given Name',
          type: 'text',
          access: createVerifiedFieldAccess('name_verified'),
        },
        {
          name: 'middle_name',
          label: 'Middle Name',
          type: 'text',
          access: createVerifiedFieldAccess('name_verified'),
        },
        {
          name: 'family_name',
          label: 'Family Name',
          type: 'text',
          access: createVerifiedFieldAccess('name_verified'),
        },
      ],
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: createVerifiedFieldAccess('email_verified'),
    },
    {
      name: 'email_verified',
      type: 'checkbox',
      defaultValue: false,
      access: verificationFlagAccess,
      admin: {
        description:
          "Indicates if the user's email has been verified by a trusted identity provider",
        position: 'sidebar',
      },
    },
    {
      name: 'name_verified',
      type: 'checkbox',
      defaultValue: false,
      access: verificationFlagAccess,
      admin: {
        description:
          "Indicates if the user's name has been verified by a trusted identity provider",
        position: 'sidebar',
      },
    },
    {
      name: 'phone_number',
      type: 'text',
      access: createVerifiedFieldAccess('phone_number_verified'),
    },
    {
      name: 'phone_number_verified',
      type: 'checkbox',
      defaultValue: false,
      access: verificationFlagAccess,
      admin: {
        description: "Indicates if the user's phone number has been verified.",
        position: 'sidebar',
      },
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'Addresses',
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Label',
          admin: {
            description: 'E.g. "Home", "Work", "Vipps", "Cabin"',
          },
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          label: 'Default Address',
          defaultValue: false,
        },
        ...addressFields(),
      ],
    },
    // The logins at identity providers (Vipps, ...) that belong to this user.
    // oidcAuthPlugin adds it when missing, but it is declared here so the
    // schema is the same whether or not a provider is enabled.
    identitiesField,
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: 'System Admin',
          value: 'system-admin',
        },
      ],
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      access: {
        create: globalRolesCreateAccess,
        read: adminsFieldLevel,
        update: globalRolesUpdateAccess,
      },
      admin: {
        description:
          'Global system administrator role. Only system admins can assign this role. ' +
          'For users who log in through the OIDC provider it is set by the provider when OIDC_SYSTEM_ADMIN_ROLE is configured.',
      },
    },
    {
      ...defaultTenantArrayField,
      required: false,
      admin: {
        ...defaultTenantArrayField?.admin,
        position: 'sidebar',
        description:
          'Optional: Assign user to specific websites/tenants. Leave empty for global access.',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterLogin: [setCookieBasedOnDomain],
    beforeOperation: [
      refusePasswordLogin,
      ({ args, operation }) => {
        // Bypass tenant filtering for system admins on read operations
        // Check if user is from 'users' collection before passing to isSystemAdmin
        if (
          operation === 'read' &&
          args.req?.user &&
          'email' in args.req.user &&
          isSystemAdmin(args.req.user)
        ) {
          // Set flag to bypass tenant scope
          args.req.context = args.req.context || {};
          args.req.context.disableMultiTenant = true;
        }
        return args;
      },
    ],
  },
};
