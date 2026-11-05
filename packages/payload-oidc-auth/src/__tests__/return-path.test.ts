import { describe, expect, it } from 'vitest';
import { loginUrl } from '../components/OidcLoginButton';
import { safeReturnPath } from '../return-path';

describe('safeReturnPath', () => {
  it('keeps a path on this site, with its query and fragment', () => {
    expect(safeReturnPath('/no/kurs/forbedring?step=2#video')).toBe(
      '/no/kurs/forbedring?step=2#video',
    );
    expect(safeReturnPath('/admin/collections/pages/abc')).toBe('/admin/collections/pages/abc');
  });

  it('refuses anything that could leave the site', () => {
    for (const value of [
      'https://evil.example.com/',
      '//evil.example.com/',
      '/\\evil.example.com',
      '\\\\evil.example.com',
      '/\tevil',
      '/\nevil',
      'javascript:alert(1)',
      'admin',
      '',
      null,
      undefined,
    ]) {
      expect(safeReturnPath(value), String(value)).toBeUndefined();
    }
  });

  it('refuses a path that is too long', () => {
    expect(safeReturnPath(`/${'a'.repeat(2048)}`)).toBeUndefined();
  });

  it('refuses the login routes themselves, so a login cannot loop', () => {
    expect(safeReturnPath('/api/auth/idp/login', '/api/auth/idp')).toBeUndefined();
    expect(safeReturnPath('/api/auth/idp', '/api/auth/idp')).toBeUndefined();
    expect(safeReturnPath('/api/auth/idpx', '/api/auth/idp')).toBe('/api/auth/idpx');
  });

  it('normalises dot segments instead of letting them climb out', () => {
    expect(safeReturnPath('/a/../../b')).toBe('/b');
  });

  it('refuses a path that only becomes //host once dot segments are resolved', () => {
    for (const value of [
      '/a/..//evil.example.com',
      '/a/../..//evil.example.com',
      '/./' + '/evil.example.com',
      '/%2e%2e//evil.example.com',
      '/a/%2E%2E//evil.example.com',
    ]) {
      expect(safeReturnPath(value), value).toBeUndefined();
    }
  });

  it('never returns a path that resolves to another origin', () => {
    const origin = 'https://shop.example.com';
    for (const value of ['/a/..//evil.example.com', '/./' + '/evil.example.com', '/ok/path']) {
      const path = safeReturnPath(value);
      if (path) expect(new URL(path, origin).origin, value).toBe(origin);
    }
  });
});

describe('loginUrl', () => {
  const page = 'https://site.example.com/admin/login';

  it('is the login path alone when nothing asks to come back', () => {
    expect(loginUrl('/api/auth/oidc/login', undefined, page)).toBe('/api/auth/oidc/login');
  });

  it("carries Payload's redirect parameter as returnTo", () => {
    expect(
      loginUrl(
        '/api/auth/oidc/login',
        undefined,
        `${page}?redirect=%2Fadmin%2Fcollections%2Fpages`,
      ),
    ).toBe('/api/auth/oidc/login?returnTo=%2Fadmin%2Fcollections%2Fpages');
  });

  it('prefers an explicit returnTo', () => {
    expect(loginUrl('/api/auth/oidc/login', '/no/kurs', `${page}?redirect=%2Fadmin`)).toBe(
      '/api/auth/oidc/login?returnTo=%2Fno%2Fkurs',
    );
  });
});
