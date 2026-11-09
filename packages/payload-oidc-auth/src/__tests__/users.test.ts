import { describe, expect, it } from 'vitest';
import { resolveProvider } from '../provider';
import type { OidcProvider } from '../types';
import { findOrCreateUser, identitiesField, OidcLoginFailure } from '../users';
import { fakePayload } from './fake-payload';

const base: OidcProvider = {
  name: 'idp',
  issuer: 'https://idp.example.com/realms/test',
  clientId: 'historia',
  clientSecret: 'secret',
};

const provider = (overrides: Partial<OidcProvider> = {}) =>
  resolveProvider({ ...base, ...overrides });

const userInfo = {
  sub: 'abc',
  email: 'kari@example.com',
  email_verified: true,
  given_name: 'Kari',
  family_name: 'Nordmann',
};

const login = (
  payload: ReturnType<typeof fakePayload>['payload'],
  info: Record<string, unknown>,
  p = provider(),
) =>
  findOrCreateUser({
    payload,
    collection: 'users',
    provider: p,
    userInfo: info as typeof userInfo,
  });

describe('findOrCreateUser', () => {
  it('creates a user with the identity and the mapped claims', async () => {
    const { payload, docs } = fakePayload();
    const user = await login(payload, userInfo);

    expect(docs.size).toBe(1);
    expect(user.password).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(user).toMatchObject({
      email: 'kari@example.com',
      email_verified: true,
      given_name: 'Kari',
      family_name: 'Nordmann',
      identities: [{ provider: 'idp', subject: 'abc' }],
    });
  });

  it('finds the user by identity, even when the email changed at the provider', async () => {
    const { payload, calls } = fakePayload([
      { id: 'u1', email: 'old@example.com', identities: [{ provider: 'idp', subject: 'abc' }] },
    ]);
    const user = await login(payload, { ...userInfo, email: 'new@example.com' });

    expect(user.id).toBe('u1');
    expect(user.email).toBe('new@example.com');
    expect(calls.filter((c) => c.method === 'create')).toHaveLength(0);
  });

  it('never writes an unverified email onto a user found by identity', async () => {
    const { payload } = fakePayload([
      {
        id: 'u1',
        email: 'kari@example.com',
        email_verified: true,
        identities: [{ provider: 'idp', subject: 'abc' }],
      },
    ]);
    const user = await login(payload, {
      ...userInfo,
      email: 'victim@example.com',
      email_verified: false,
      given_name: 'K',
    });

    expect(user.id).toBe('u1');
    expect(user.email).toBe('kari@example.com');
    expect(user.email_verified).toBe(true);
    expect(user.given_name).toBe('K');
  });

  it('matches and stores the email the way Payload does: lowercased and trimmed', async () => {
    const { payload, docs } = fakePayload([{ id: 'u1', email: 'kari@example.com' }]);
    const user = await login(payload, { ...userInfo, email: ' Kari@Example.com ' });

    expect(user.id).toBe('u1');
    expect(user.email).toBe('kari@example.com');
    expect(docs.size).toBe(1);
  });

  it('does not match the same subject at another provider', async () => {
    const { payload } = fakePayload([
      { id: 'u1', email: 'other@example.com', identities: [{ provider: 'vipps', subject: 'abc' }] },
    ]);
    const user = await login(payload, userInfo);

    expect(user.id).not.toBe('u1');
  });

  it('links an existing user by verified email and keeps other identities', async () => {
    const { payload } = fakePayload([
      { id: 'u1', email: 'kari@example.com', identities: [{ provider: 'vipps', subject: 'v1' }] },
    ]);
    const user = await login(payload, userInfo);

    expect(user.id).toBe('u1');
    expect(user.identities).toEqual([
      { provider: 'vipps', subject: 'v1' },
      { provider: 'idp', subject: 'abc' },
    ]);
  });

  it('refuses an unverified email, so an account cannot be taken over', async () => {
    const { payload, docs } = fakePayload([{ id: 'u1', email: 'kari@example.com' }]);

    await expect(login(payload, { ...userInfo, email_verified: false })).rejects.toMatchObject({
      code: 'email_not_verified',
    });
    expect(docs.get('u1')?.identities).toBeUndefined();
  });

  it('refuses an unverified email for a new user too', async () => {
    const { payload, docs } = fakePayload();

    await expect(login(payload, { ...userInfo, email_verified: undefined })).rejects.toBeInstanceOf(
      OidcLoginFailure,
    );
    expect(docs.size).toBe(0);
  });

  it('accepts an unverified email when the provider opts out of the check', async () => {
    const { payload } = fakePayload([{ id: 'u1', email: 'kari@example.com' }]);
    const user = await login(
      payload,
      { ...userInfo, email_verified: false },
      provider({ requireVerifiedEmail: false }),
    );

    expect(user.id).toBe('u1');
  });

  it('refuses a new user when signup is off', async () => {
    const { payload } = fakePayload();

    await expect(login(payload, userInfo, provider({ allowSignup: false }))).rejects.toMatchObject({
      code: 'signup_disabled',
    });
  });

  it('still logs in a known identity when signup is off', async () => {
    const { payload } = fakePayload([
      { id: 'u1', email: 'kari@example.com', identities: [{ provider: 'idp', subject: 'abc' }] },
    ]);
    const user = await login(payload, userInfo, provider({ allowSignup: false }));

    expect(user.id).toBe('u1');
  });

  it('needs an email', async () => {
    const { payload } = fakePayload();

    await expect(login(payload, { sub: 'abc' })).rejects.toMatchObject({ code: 'no_email' });
  });

  it('gives mapUser the existing user, and writes what it returns', async () => {
    const { payload } = fakePayload([{ id: 'u1', email: 'kari@example.com', nick: 'K' }]);
    const user = await login(
      payload,
      userInfo,
      provider({
        mapUser: (info, existing) => ({ nick: `${existing?.nick ?? ''}+${info.given_name}` }),
      }),
    );

    expect(user.nick).toBe('K+Kari');
  });
});

describe('identitiesField', () => {
  it('refuses writes from anyone, so only the plugin itself can set identities', () => {
    const access = 'access' in identitiesField ? (identitiesField.access ?? {}) : {};
    // biome-ignore lint/suspicious/noExplicitAny: the access functions read nothing from the args
    const args = {} as any;
    expect(access.create?.(args)).toBe(false);
    expect(access.update?.(args)).toBe(false);
    expect(access.read).toBeUndefined();
  });
});
