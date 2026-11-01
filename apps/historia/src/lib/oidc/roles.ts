/**
 * The global roles a login through the OIDC provider grants, read from its
 * claims. With the provider authoritative, the result replaces the user's
 * roles on every login: a role the provider does not send is taken away, and a
 * missing or malformed claim means no roles at all.
 */

import type { User } from '@/payload-types';

type GlobalRole = NonNullable<User['roles']>[number];

/**
 * The strings at `path` (dotted, such as `realm_access.roles`) in `claims`: a
 * string array as-is, a lone string as one element, anything else as none.
 */
export function claimValues(claims: unknown, path: string): string[] {
  let value: unknown = claims;
  for (const key of path.split('.')) {
    if (typeof value !== 'object' || value === null) return [];
    value = (value as Record<string, unknown>)[key];
  }
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

/** The user's global roles according to the provider. */
export function globalRolesFromClaims(
  claims: unknown,
  options: { rolesClaim: string; systemAdminRole: string },
): GlobalRole[] {
  const roles = claimValues(claims, options.rolesClaim);
  return roles.includes(options.systemAdminRole) ? ['system-admin'] : [];
}
