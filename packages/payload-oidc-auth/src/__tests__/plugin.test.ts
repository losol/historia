import type { CollectionConfig, Config } from 'payload';
import { describe, expect, it } from 'vitest';
import { oidcAuthPlugin } from '../plugin';
import { resolveConfig, resolveProvider } from '../provider';

const provider = {
  name: 'idp',
  issuer: 'https://idp.example.com/realms/test',
  clientId: 'historia',
  clientSecret: 'secret',
};

const users = (): CollectionConfig => ({
  slug: 'users',
  auth: true,
  fields: [{ name: 'email', type: 'email' }],
});

describe('resolveProvider', () => {
  it('applies the defaults', () => {
    expect(resolveProvider(provider)).toMatchObject({
      label: 'idp',
      scope: 'openid profile email',
      basePath: '/api/auth/idp',
      allowSignup: true,
      requireVerifiedEmail: true,
    });
  });

  it.each(['Idp', 'my idp', '', 'a/b'])('rejects the name %j', (name) => {
    expect(() => resolveProvider({ ...provider, name })).toThrow(/name/);
  });

  it.each(['issuer', 'clientId', 'clientSecret'] as const)('needs a %s', (key) => {
    expect(() => resolveProvider({ ...provider, [key]: '' })).toThrow(key);
  });

  it('rejects a provider configured twice', () => {
    expect(() => resolveConfig({ providers: [provider, provider] })).toThrow(/twice/);
  });
});

describe('oidcAuthPlugin', () => {
  it('adds the endpoints, the strategy and the identities field', () => {
    const config = oidcAuthPlugin({ providers: [provider] })({
      collections: [users()],
    } as Config);

    expect(config.endpoints?.map((e) => `${e.method.toUpperCase()} ${e.path}`)).toEqual([
      'GET /auth/idp/login',
      'GET /auth/idp/callback',
      'GET /auth/idp/session',
    ]);

    const auth = config.collections?.[0]?.auth;
    expect(auth).not.toBe(true);
    expect(auth && auth !== true && auth.strategies?.map((s) => s.name)).toEqual(['oidc-idp']);
    expect(config.collections?.[0]?.fields.map((f) => 'name' in f && f.name)).toContain(
      'identities',
    );
  });

  it('keeps strategies and fields that were already there', () => {
    const collection = users();
    collection.auth = {
      strategies: [{ name: 'other', authenticate: async () => ({ user: null }) }],
    };
    collection.fields.push({ name: 'identities', type: 'array', fields: [] });

    const config = oidcAuthPlugin({ providers: [provider] })({
      collections: [collection],
    } as Config);

    const auth = config.collections?.[0]?.auth;
    expect(auth && auth !== true && auth.strategies?.map((s) => s.name)).toEqual([
      'other',
      'oidc-idp',
    ]);
    expect(
      config.collections?.[0]?.fields.filter((f) => 'name' in f && f.name === 'identities'),
    ).toHaveLength(1);
  });

  it('follows a custom API route', () => {
    const config = oidcAuthPlugin({
      providers: [{ ...provider, basePath: '/cms/login/idp' }],
    })({ collections: [users()], routes: { api: '/cms' } } as Config);

    expect(config.endpoints?.[0]?.path).toBe('/login/idp/login');
  });

  it('refuses a basePath Payload cannot serve', () => {
    expect(() =>
      oidcAuthPlugin({ providers: [{ ...provider, basePath: '/auth/idp' }] })({
        collections: [users()],
      } as Config),
    ).toThrow(/basePath/);
  });

  it('does nothing when off', () => {
    const incoming = { collections: [users()] } as Config;
    const config = oidcAuthPlugin({ providers: [provider], enabled: false })(incoming);

    expect(config.endpoints).toBeUndefined();
    expect(config.collections?.[0]?.auth).toBe(true);
  });
});
