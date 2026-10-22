/** Cookie helpers for the login handshake. Everything is HttpOnly and SameSite=Lax. */

import type { IncomingRequest } from './types';

export function parseCookies(headers: Headers): Map<string, string> {
  const cookies = new Map<string, string>();
  const header = headers.get('cookie');
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    const raw = rest.join('=');
    try {
      cookies.set(name, decodeURIComponent(raw));
    } catch {
      cookies.set(name, raw);
    }
  }
  return cookies;
}

export function getCookie(request: IncomingRequest, name: string): string | undefined {
  return parseCookies(request.headers).get(name);
}

export function setCookieHeader(
  name: string,
  value: string,
  options: { maxAge: number; secure: boolean; path?: string },
): string {
  return `${name}=${encodeURIComponent(value)}; Path=${options.path ?? '/'}; HttpOnly; SameSite=Lax; Max-Age=${options.maxAge}${options.secure ? '; Secure' : ''}`;
}

/** Clears a cookie; the path must be the one it was set with. */
export function clearCookieHeader(name: string, secure: boolean, path = '/'): string {
  return `${name}=; Path=${path}; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

/**
 * The `state` of a login, as the provider sent it back. Only openid-client's own
 * format (base64url) is accepted, because the value becomes part of cookie names.
 */
export function isValidState(state: string | null): state is string {
  return !!state && /^[A-Za-z0-9_-]{1,256}$/.test(state);
}

/** A redirect built by hand: `Response.redirect()` returns immutable headers. */
export function redirect(location: string | URL, setCookies: string[] = []): Response {
  const headers = new Headers({ Location: location.toString() });
  for (const cookie of setCookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

/** The cookies one login attempt leaves between the login and callback routes. */
export function handshakeCookies(providerName: string, state: string) {
  return {
    verifier: `${providerName}_pkce_${state}`,
    redirectUri: `${providerName}_redirect_${state}`,
  };
}

/**
 * The cookie that carries a finished login from the callback to the strategy. It
 * is scoped to the session route, so no other request in the handoff window can
 * consume it.
 */
export function pendingSessionCookie(provider: { name: string; basePath: string }) {
  return { name: `__${provider.name}_session_pending`, path: `${provider.basePath}/session` };
}
