import { describe, expect, it } from 'vitest';
import { claimValues, globalRolesFromClaims } from './roles';

const keycloak = { rolesClaim: 'realm_access.roles', systemAdminRole: 'historia-admin' };

describe('claimValues', () => {
  it('follows a dotted path to a string array', () => {
    const claims = { realm_access: { roles: ['a', 'b'] } };
    expect(claimValues(claims, 'realm_access.roles')).toEqual(['a', 'b']);
  });

  it('reaches client roles under resource_access', () => {
    const claims = { resource_access: { historia: { roles: ['editor'] } } };
    expect(claimValues(claims, 'resource_access.historia.roles')).toEqual(['editor']);
  });

  it('treats a lone string as one value', () => {
    expect(claimValues({ role: 'admin' }, 'role')).toEqual(['admin']);
  });

  it('is empty when the path is missing or not an array of strings', () => {
    expect(claimValues({}, 'realm_access.roles')).toEqual([]);
    expect(claimValues({ realm_access: null }, 'realm_access.roles')).toEqual([]);
    expect(claimValues({ realm_access: 'x' }, 'realm_access.roles')).toEqual([]);
    expect(claimValues({ realm_access: { roles: 7 } }, 'realm_access.roles')).toEqual([]);
    expect(claimValues(undefined, 'realm_access.roles')).toEqual([]);
  });

  it('keeps only the strings of a mixed array', () => {
    expect(claimValues({ roles: ['a', 1, null, 'b'] }, 'roles')).toEqual(['a', 'b']);
  });
});

describe('globalRolesFromClaims', () => {
  it('grants system-admin when the provider sends the role', () => {
    const claims = { realm_access: { roles: ['default-roles-x', 'historia-admin'] } };
    expect(globalRolesFromClaims(claims, keycloak)).toEqual(['system-admin']);
  });

  it('grants nothing when the role is absent', () => {
    const claims = { realm_access: { roles: ['default-roles-x'] } };
    expect(globalRolesFromClaims(claims, keycloak)).toEqual([]);
  });

  it('grants nothing when the claim is missing altogether', () => {
    expect(globalRolesFromClaims({ sub: '1', email: 'a@b.c' }, keycloak)).toEqual([]);
  });

  it('matches the role name exactly', () => {
    const claims = { realm_access: { roles: ['historia-admins', 'HISTORIA-ADMIN'] } };
    expect(globalRolesFromClaims(claims, keycloak)).toEqual([]);
  });
});
