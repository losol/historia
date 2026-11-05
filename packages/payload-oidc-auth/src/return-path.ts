/**
 * Where to send the person after login, when the page that started it asked for
 * it with `?returnTo=`. Only a path on the same site is accepted. Anything that
 * could leave it, such as another origin, `//host`, a backslash or a control
 * character, is dropped, so the parameter cannot be used as an open redirect.
 * It is checked again at every step, since each step reads it from the request.
 */

export const RETURN_TO_PARAM = 'returnTo';

const MAX_LENGTH = 2048;
const BASE = 'http://return-path.invalid';

/**
 * `value` as a path on this site, or `undefined` when it is not a safe one. A
 * path under `basePath` is refused too: going back to a login route would start
 * another login.
 */
export function safeReturnPath(
  value: string | null | undefined,
  basePath?: string,
): string | undefined {
  if (!value || value.length > MAX_LENGTH) return undefined;
  if (!value.startsWith('/') || value.startsWith('//')) return undefined;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    // Browsers treat a backslash as a slash, and drop tabs and newlines.
    if (code < 0x20 || code === 0x7f || code === 0x5c) return undefined;
  }

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return undefined;
  }
  if (url.origin !== BASE) return undefined;
  if (basePath && (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`))) {
    return undefined;
  }
  // Resolving dot segments can turn `/a/..//host` into `//host`, which a browser
  // reads as another origin. So the result is checked again, as it will be used.
  const path = `${url.pathname}${url.search}${url.hash}`;
  if (path.startsWith('//') || new URL(path, BASE).origin !== BASE) return undefined;
  return path;
}
