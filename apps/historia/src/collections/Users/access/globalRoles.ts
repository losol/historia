import type { FieldAccess } from 'payload';
import { adminsFieldLevel } from '@/access/admins';
import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import type { User } from '@/payload-types';

/** Whether the user has logged in through the generic OIDC provider. */
export function hasOidcIdentity(user: Partial<User> | undefined): boolean {
  return Boolean(user?.identities?.some((identity) => identity.provider === 'oidc'));
}

/**
 * Who may change the global roles. Admins, as for the other admin-only fields,
 * except on a user the OIDC provider is the source of the roles for: a change
 * made by hand there would be undone on the next login, so it is refused up
 * front, and the field is read-only in the admin. The provider's own writes go
 * through the local API with access overridden, so they are unaffected.
 */
export const globalRolesUpdateAccess: FieldAccess = (args) => {
  if (getOidcLoginEnv().rolesSynced && hasOidcIdentity(args.doc as Partial<User> | undefined)) {
    return false;
  }
  return adminsFieldLevel(args);
};
