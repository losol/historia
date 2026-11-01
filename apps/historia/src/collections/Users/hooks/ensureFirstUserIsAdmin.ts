import type { FieldHook } from 'payload';
import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import type { User } from '@/payload-types';

/**
 * The first user on an empty install becomes a system admin, since nobody else
 * could grant the role. Not when the OIDC provider is the source of the global
 * roles: then the first admin is whoever it says is one, and a first user it
 * does not vouch for must not get the role by being first.
 */
export const ensureFirstUserIsAdmin: FieldHook<User> = async ({ req, operation, value }) => {
  if (operation === 'create' && !getOidcLoginEnv().rolesSynced) {
    const users = await req.payload.find({ collection: 'users', limit: 0, depth: 0 });

    if (users.totalDocs === 0) {
      // First user must be system-admin
      return ['system-admin'];
    }
  }

  return value;
};
