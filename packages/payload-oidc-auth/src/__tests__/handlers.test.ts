import { beforeAll, describe, expect, it } from 'vitest';
import { handshakeCookies, parseCookies } from '../cookies';
import { handleOidcCallback, handleOidcLogin, handleOidcSession } from '../handlers';
import { getPublicRequestOrigin } from '../origin';
import { resolveProvider } from '../provider';
import type { OidcClient, OidcUserInfo } from '../types';
import { fakePayload } from './fake-payload';

beforeAll(() => {
  process.env.SESSION_SECRET = 'b'.repeat(64);
});

/** A client that never talks to a provider. */
function fakeClient(userInfo: Partial<OidcUserInfo> = {}): OidcClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async buildPKCEOptions() {
      return {
        code_verifier: 'verifier',
        code_challenge: 'challenge',
        state: 'st4te',
        parameters: {},
      };
    },
    async buildAuthorizationUrl() {
      return new URL('https://idp.example.com/authorize?state=st4te');
    },
    async exchangeCodeForTokens(callbackUrl, codeVerifier, state) {
      calls.push({ callbackUrl: callbackUrl.toString(), codeVerifier, state });
      return { access_token: 'at', token_type: 'bearer' } as never;
    },
    async getUserInfo() {
      return { sub: 'abc', email: 'kari@example.com', email_verified: true, ...userInfo };
    },
  };
}

const provider = (client: OidcClient) =>
  resolveProvider({
    name: 'idp',
    issuer: 'https://idp.example.com/realms/test',
    clientId: 'historia',
    clientSecret: 'secret',
    createClient: () => client,
  });

const setCookies = (response: Response) =>
  response.headers.getSetCookie().map((c) => c.split(';')[0] as string);

describe('getPublicRequestOrigin', () => {
  const request = (headers: Record<string, string>) => ({
    url: 'http://127.0.0.1:3000/api/auth/idp/login',
    headers: new Headers(headers),
  });

  it('uses the host header, with https outside localhost', () => {
    expect(getPublicRequestOrigin(request({ host: 'shop.example.com' }))).toBe(
      'https://shop.example.com',
    );
    expect(getPublicRequestOrigin(request({ host: 'localhost:3000' }))).toBe(
      'http://localhost:3000',
    );
  });

  it('trusts a forwarded host only when it is allowed', () => {
    const headers = { host: 'internal:3000', 'x-forwarded-host': 'shop.example.com' };
    expect(getPublicRequestOrigin(request(headers))).toBe('https://internal:3000');
    expect(getPublicRequestOrigin(request(headers), ['shop.example.com'])).toBe(
      'https://shop.example.com',
    );
    expect(getPublicRequestOrigin(request(headers), ['other.example.com'])).toBe(
      'https://internal:3000',
    );
  });
});

describe('handleOidcLogin', () => {
  it('sends the person to the provider and keeps the handshake in cookies', async () => {
    const response = await handleOidcLogin(
      { url: 'https://shop.example.com/api/auth/idp/login', headers: new Headers() },
      provider(fakeClient()),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://idp.example.com/authorize?state=st4te');
    expect(setCookies(response)).toEqual([
      'idp_pkce_st4te=verifier',
      'idp_redirect_st4te=https%3A%2F%2Fshop.example.com%2Fapi%2Fauth%2Fidp%2Fcallback',
    ]);
    expect(response.headers.getSetCookie()[0]).toContain(
      'HttpOnly; SameSite=Lax; Max-Age=600; Secure',
    );
  });
});

describe('handleOidcLogin with returnTo', () => {
  const login = (query: string) =>
    handleOidcLogin(
      { url: `https://shop.example.com/api/auth/idp/login?${query}`, headers: new Headers() },
      provider(fakeClient()),
    );

  it('keeps a path on this site for after the login', async () => {
    const response = await login('returnTo=%2Fno%2Fkurs%2Fforbedring');
    expect(setCookies(response)).toContain('idp_return_st4te=%2Fno%2Fkurs%2Fforbedring');
  });

  it('drops a return path that leaves the site', async () => {
    for (const bad of [
      'https%3A%2F%2Fevil.example.com',
      '%2F%2Fevil.example.com',
      '%2Fapi%2Fauth%2Fidp%2Flogin',
    ]) {
      const response = await login(`returnTo=${bad}`);
      expect(setCookies(response).some((c) => c.startsWith('idp_return_'))).toBe(false);
    }
  });
});

describe('handleOidcCallback', () => {
  const cookies = handshakeCookies('idp', 'st4te');
  const callback = (client: OidcClient, query = 'code=c0de&state=st4te', cookie?: string) => {
    const { payload, docs } = fakePayload();
    const request = {
      url: `https://shop.example.com/api/auth/idp/callback?${query}`,
      headers: new Headers({
        cookie:
          cookie ??
          `${cookies.verifier}=verifier; ${cookies.redirectUri}=${encodeURIComponent('https://shop.example.com/api/auth/idp/callback')}`,
      }),
    };
    return {
      docs,
      response: handleOidcCallback(request, provider(client), payload, {
        collection: 'users',
        errorPath: '/admin/login?error={error}',
      }),
    };
  };

  it('exchanges the code, creates the user and hands over to the session route', async () => {
    const client = fakeClient();
    const { response: pending, docs } = callback(client);
    const response = await pending;

    expect(client.calls).toEqual([
      {
        callbackUrl: 'https://shop.example.com/api/auth/idp/callback?code=c0de&state=st4te',
        codeVerifier: 'verifier',
        state: 'st4te',
      },
    ]);
    expect(docs.size).toBe(1);
    expect(response.headers.get('location')).toBe('https://shop.example.com/api/auth/idp/session');

    const set = parseCookies(new Headers({ cookie: setCookies(response).join('; ') }));
    expect(set.get('__idp_session_pending')).toBeTruthy();
    expect(set.get(cookies.verifier)).toBe('');
    expect(set.get(cookies.redirectUri)).toBe('');
    expect(set.get(cookies.returnTo)).toBe('');

    // Only the session route gets the pending cookie, so no other request can use it up.
    const pendingHeader = response.headers
      .getSetCookie()
      .find((c) => c.startsWith('__idp_session_pending='));
    expect(pendingHeader).toContain('; Path=/api/auth/idp/session;');
  });

  it('passes the return path on to the session route', async () => {
    const cookie = [
      `${cookies.verifier}=verifier`,
      `${cookies.redirectUri}=${encodeURIComponent('https://shop.example.com/api/auth/idp/callback')}`,
      `${cookies.returnTo}=${encodeURIComponent('/no/kurs?x=1')}`,
    ].join('; ');
    const response = await callback(fakeClient(), undefined, cookie).response;
    expect(response.headers.get('location')).toBe(
      'https://shop.example.com/api/auth/idp/session?returnTo=%2Fno%2Fkurs%3Fx%3D1',
    );
  });

  it('checks the return path cookie again, and drops it when it leaves the site', async () => {
    const cookie = [
      `${cookies.verifier}=verifier`,
      `${cookies.redirectUri}=${encodeURIComponent('https://shop.example.com/api/auth/idp/callback')}`,
      `${cookies.returnTo}=${encodeURIComponent('//evil.example.com')}`,
    ].join('; ');
    const response = await callback(fakeClient(), undefined, cookie).response;
    expect(response.headers.get('location')).toBe('https://shop.example.com/api/auth/idp/session');
  });

  it('rejects a state that is not one of ours, so it never reaches a cookie header', async () => {
    const response = await callback(
      fakeClient(),
      `code=c0de&state=${encodeURIComponent('x; Domain=evil.example; Path=/admin')}`,
    ).response;

    expect(response.headers.get('location')).toContain('error=invalid_callback');
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('clears the handshake when the callback has a state but no code', async () => {
    const response = await callback(fakeClient(), 'state=st4te').response;

    expect(response.headers.get('location')).toContain('error=invalid_callback');
    expect(setCookies(response)).toEqual([
      `${cookies.verifier}=`,
      `${cookies.redirectUri}=`,
      `${cookies.returnTo}=`,
    ]);
  });

  it('fails with the provider error', async () => {
    const response = await callback(fakeClient(), 'error=access_denied&state=st4te').response;
    expect(response.headers.get('location')).toBe(
      'https://shop.example.com/admin/login?error=oauth_failed',
    );
  });

  it('fails without the handshake cookie', async () => {
    const response = await callback(fakeClient(), undefined, '').response;
    expect(response.headers.get('location')).toContain('error=invalid_state');
  });

  it('fails when the email is not verified, and creates nothing', async () => {
    const { response: pending, docs } = callback(fakeClient({ email_verified: false }));
    const response = await pending;

    expect(response.headers.get('location')).toContain('error=email_not_verified');
    expect(docs.size).toBe(0);
  });
});

describe('handleOidcSession', () => {
  const payload = {
    secret: 'p'.repeat(32),
    config: { cookiePrefix: 'payload' },
    collections: {
      users: {
        config: { auth: { tokenExpiration: 7200, cookies: { sameSite: 'Lax', secure: true } } },
      },
    },
  };
  const session = (query = '') =>
    handleOidcSession(
      { url: `https://shop.example.com/api/auth/idp/session${query}`, headers: new Headers() },
      payload as never,
      {
        collection: 'users',
        successPath: '/admin',
        errorPath: '/admin/login?error={error}',
        basePath: '/api/auth/idp',
        user: { id: 'u1', email: 'kari@example.com' } as never,
      },
    );

  it('sets the Payload cookie and goes to the success path', async () => {
    const response = await session();
    expect(response.headers.get('location')).toBe('https://shop.example.com/admin');
    expect(setCookies(response)[0]).toMatch(/^payload-token=/);
  });

  it('goes back to the page the login was started from', async () => {
    const response = await session('?returnTo=%2Fno%2Fkurs%2Fforbedring');
    expect(response.headers.get('location')).toBe('https://shop.example.com/no/kurs/forbedring');
  });

  it('ignores a return path that leaves the site or loops back into login', async () => {
    for (const bad of [
      '%2F%2Fevil.example.com',
      'https%3A%2F%2Fevil.example.com',
      '%2Fapi%2Fauth%2Fidp%2Flogin',
    ]) {
      const response = await session(`?returnTo=${bad}`);
      expect(response.headers.get('location')).toBe('https://shop.example.com/admin');
    }
  });
});
