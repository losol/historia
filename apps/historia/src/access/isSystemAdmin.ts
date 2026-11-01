import type { Access, FieldAccess } from 'payload';
import type { User } from '../payload-types';

export const isSystemAdminAccess: Access = ({ req }): boolean => {
  // Check if user is from 'users' collection before passing to isSystemAdmin
  if (req.user && 'email' in req.user) {
    return isSystemAdmin(req.user as User);
  }
  return false;
};

export const isSystemAdmin = (user: User | null): boolean => {
  return Boolean(user?.roles?.includes('system-admin'));
};

/**
 * Field-level access for what only a system admin may write: the fields that
 * grant access, such as the global roles and the site roles. A site admin may
 * update the users of their own sites, and could otherwise grant any of them,
 * or themselves, more than they have.
 */
export const systemAdminsFieldLevel: FieldAccess = ({ req: { user } }) =>
  Boolean(user && 'email' in user && isSystemAdmin(user as User));
