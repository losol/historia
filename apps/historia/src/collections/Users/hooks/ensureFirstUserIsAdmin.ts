import type { FieldHook } from 'payload';
import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import type { User } from '@/payload-types';
import { hasOidcIdentity } from '../access/globalRoles';

/**
 * The first user on an empty install becomes a system admin, since nobody else
 * could grant the role. Not a user the OIDC provider creates while it is the
 * source of the global roles: then the roles it sent are the roles, and a first
 * person it does not vouch for must not get the role by being first. A first
 * user created with a password (create-first-user) still gets it, whatever the
 * provider settings: the install has to be bootstrapped somehow.
 */
export const ensureFirstUserIsAdmin: FieldHook<User> = async ({ data, req, operation, value }) => {
  if (operation !== 'create') return value;
  if (getOidcLoginEnv().rolesSynced && hasOidcIdentity(data)) return value;

  const users = await req.payload.find({ collection: 'users', limit: 0, depth: 0 });
  if (users.totalDocs === 0) {
    // First user must be system-admin
    return ['system-admin'];
  }

  return value;
};
