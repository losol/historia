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
  options: { maxAge: number; secure: boolean },
): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${options.maxAge}${options.secure ? '; Secure' : ''}`;
}

export function clearCookieHeader(name: string, secure: boolean): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
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

/** The cookie that carries a finished login from the callback to the strategy. */
export function pendingSessionCookie(providerName: string): string {
  return `__${providerName}_session_pending`;
}
