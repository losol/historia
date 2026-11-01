import type { FieldAccess } from 'payload';
import { systemAdminsFieldLevel } from '@/access/isSystemAdmin';
import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import type { User } from '@/payload-types';

/**
 * Whether the user has logged in through the generic OIDC provider. Only the
 * provider writes `identities` (the field refuses other writes), so this cannot
 * be faked by editing the user.
 */
export function hasOidcIdentity(user: Partial<User> | undefined): boolean {
  return Boolean(user?.identities?.some((identity) => identity.provider === 'oidc'));
}

/**
 * Only a system admin may grant or take away the global roles (ADR 0001). The
 * first user on an empty install still gets the role from
 * ensureFirstUserIsAdmin, which runs after this check and is not subject to it.
 */
export const globalRolesCreateAccess: FieldAccess = systemAdminsFieldLevel;

/**
 * Who may change the global roles: system admins, except on a user the OIDC
 * provider is the source of the roles for. A change made by hand there would
 * be undone on the next login, so it is refused up front, and the field is
 * read-only in the admin. The provider's own writes go through the local API
 * with access overridden, so they are unaffected.
 */
export const globalRolesUpdateAccess: FieldAccess = (args) => {
  if (getOidcLoginEnv().rolesSynced && hasOidcIdentity(args.doc as Partial<User> | undefined)) {
    return false;
  }
  return systemAdminsFieldLevel(args);
};
