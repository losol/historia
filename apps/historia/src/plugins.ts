/**
 * Payload CMS Plugins Configuration
 *
 * Centralized configuration for all Payload plugins used in Historia.
 */

import { eventApiClientPlugin } from '@eventuras/payload-event-api-client';
import { type OidcProvider, oidcAuthPlugin } from '@eventuras/payload-oidc-auth';
import { vippsProvider } from '@eventuras/payload-vipps-auth';
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder';
import { importExportPlugin } from '@payloadcms/plugin-import-export';
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs';
import { redirectsPlugin } from '@payloadcms/plugin-redirects';
import { searchPlugin } from '@payloadcms/plugin-search';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import type { Plugin } from 'payload';
import { anyone } from '@/access/anyone';
import { isSystemAdmin } from '@/access/isSystemAdmin';
import { siteScoped } from '@/access/siteScoped';
import { allowedOrigins, getAllowedDomainsFromAllowedOrigins } from '@/config/allowed-origins';
import { revalidateRedirects } from '@/hooks/revalidateRedirects';
import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import { mergeVippsAddress } from '@/lib/vipps/login-address';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';
import type { Config, User } from '@/payload-types';
import { beforeSyncWithSearch } from '@/search/beforeSync';
import { searchFields } from '@/search/fieldOverrides';
import { getUserTenantIDs } from '@/utilities/getUserTenantIDs';

const requiredS3MediaVars = [
  'CMS_MEDIA_S3_ACCESS_KEY_ID',
  'CMS_MEDIA_S3_ENDPOINT',
  'CMS_MEDIA_S3_SECRET_ACCESS_KEY',
  'CMS_MEDIA_S3_REGION',
  'CMS_MEDIA_S3_BUCKET',
];

type UserAddress = NonNullable<User['addresses']>[number];

const areAllS3VarsPresent = requiredS3MediaVars.every((varName) => process.env[varName]);

const vippsLogin = getVippsLoginEnv();
const oidcLogin = getOidcLoginEnv();

// The identity providers that are turned on. Vipps has its own package, for the
// headers its userinfo endpoint wants; any plain OIDC provider, such as Keycloak
// (Tessera), goes through the generic one with its settings from the environment.
// biome-ignore lint/suspicious/noExplicitAny: each provider carries its own user-info type
const identityProviders: OidcProvider<any>[] = [];

if (oidcLogin.enabled) {
  identityProviders.push({
    name: 'oidc',
    label: oidcLogin.label,
    issuer: oidcLogin.issuer,
    clientId: oidcLogin.clientId,
    clientSecret: oidcLogin.clientSecret,
    allowSignup: oidcLogin.allowSignup,
    mapUser: (user) => ({
      email: user.email,
      email_verified: user.email_verified,
      given_name: user.given_name,
      family_name: user.family_name,
    }),
  });
}

if (vippsLogin.enabled) {
  identityProviders.push(
    vippsProvider({
      apiUrl: vippsLogin.apiUrl,
      clientId: vippsLogin.clientId,
      clientSecret: vippsLogin.clientSecret,

      mapVippsUser: (vippsUser, existingUser) => {
        // Only the address labelled "Vipps" is kept in sync; any others the user
        // added are left alone. See mergeVippsAddress.
        const addresses = mergeVippsAddress(
          existingUser && Array.isArray(existingUser.addresses)
            ? (existingUser.addresses as UserAddress[])
            : undefined,
          vippsUser.addresses,
        );

        return {
          email: vippsUser.email,
          email_verified: vippsUser.email_verified,
          given_name: vippsUser.given_name,
          middle_name: null, // Vipps doesn't provide middle_name as separate field
          family_name: vippsUser.family_name,
          name_verified: true,
          phone_number: vippsUser.phone_number,
          phone_number_verified: vippsUser.phone_number_verified,
          ...(addresses && { addresses }),
        };
      },
    }),
  );
}

export const plugins: Plugin[] = [
  importExportPlugin({
    collections: [
      { slug: 'articles' },
      { slug: 'instructions' },
      { slug: 'notes' },
      { slug: 'pages' },
      { slug: 'users' },
      { slug: 'orders' },
    ],
  }),
  mcpPlugin({
    collections: {
      articles: {
        enabled: true,
      },
      happenings: {
        enabled: true,
      },
      pages: {
        enabled: true,
      },
      notes: {
        enabled: true,
      },
      persons: {
        enabled: true,
      },
      organizations: {
        enabled: true,
      },
      topics: {
        enabled: true,
      },
      websites: {
        enabled: true,
      },
    },
  }),
  s3Storage({
    enabled: areAllS3VarsPresent,
    collections: {
      media: true,
    },
    // All of these are set whenever the plugin is enabled (see areAllS3VarsPresent);
    // the '' fallbacks only reach a disabled plugin.
    bucket: process.env.CMS_MEDIA_S3_BUCKET ?? '',
    config: {
      credentials: {
        accessKeyId: process.env.CMS_MEDIA_S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.CMS_MEDIA_S3_SECRET_ACCESS_KEY ?? '',
      },
      endpoint: process.env.CMS_MEDIA_S3_ENDPOINT ?? '',
      region: process.env.CMS_MEDIA_S3_REGION ?? '',
    },
  }),
  redirectsPlugin({
    collections: ['articles', 'notes', 'pages'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            };
          }
          return field;
        });
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['pages'],
    generateLabel: (_, doc) => doc.title as string,
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ];
                },
              }),
            };
          }
          return field;
        });
      },
    },
  }),
  searchPlugin({
    collections: ['articles', 'notes', 'pages'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      // Visitors search the site they are on; the multi-tenant plugin scopes members.
      access: {
        read: siteScoped(anyone),
      },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields];
      },
    },
  }),
  // After searchPlugin, which adds the search collection this scopes.
  multiTenantPlugin<Config>({
    tenantsSlug: 'websites',
    cleanupAfterTenantDelete: false,
    collections: {
      articles: {},
      carts: {},
      cases: {},
      happenings: {},
      instructions: {},
      notes: {},
      orders: {},
      pages: {},
      products: {},
      quotes: {},
      shipments: {},
      sources: {},
      terms: {},
      timelines: {},
      search: {},
      topics: {},
      transactions: {},
    },
    tenantField: {
      access: {
        read: () => true,
        update: ({ req }) => {
          // Check if user is from 'users' collection before passing to functions
          if (req.user && 'email' in req.user) {
            if (isSystemAdmin(req.user)) {
              return true;
            }
            return getUserTenantIDs(req.user).length > 0;
          }
          return false;
        },
      },
    },
    tenantsArrayField: {
      includeDefaultField: false,
    },
    useUsersTenantFilter: false,
    userHasAccessToAllTenants: (user) => {
      // Check if user is from 'users' collection before passing to isSystemAdmin
      return user && 'email' in user && isSystemAdmin(user);
    },
  }),
  // No collections: the SEO fields are placed by hand via `@/fields/seo`.
  // Registering the plugin still matters, as it provides the translations
  // those field components render with.
  seoPlugin({}),
  // Every identity provider goes through one plugin, which serves the login
  // routes under /api/auth/{provider} and matches users by the provider's
  // subject (the `identities` field). With no provider on, it does nothing.
  oidcAuthPlugin({
    // The domains Historia serves, so the login returns to the one the person is on.
    allowedDomains: () => getAllowedDomainsFromAllowedOrigins(allowedOrigins),
    providers: identityProviders,
  }),
  // The "Event list" block on pages: upcoming events from Eventuras, linking to
  // their pages there. The block is always in the schema, so the database is
  // the same with or without Eventuras; the block renders nothing when it is off.
  eventApiClientPlugin({ collections: ['pages'] }),
];
