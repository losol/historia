/**
 * The host a request was made to, as the visitor sees it: the first
 * `X-Forwarded-Host` behind the proxy, else `Host`. Lower-cased, since host names
 * are case-insensitive; the port is kept, so `localhost:3100` in development
 * matches a website configured for it. Null when the request carries no host,
 * which is the Local API called outside a request.
 */
export function getRequestHost(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwarded || headers.get('host')?.trim();
  return host ? host.toLowerCase() : null;
}
