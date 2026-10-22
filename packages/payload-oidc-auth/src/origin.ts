/**
 * The public origin of a request, for the redirect URI and the final redirects.
 *
 * Behind a proxy, `request.url` is the internal address. `X-Forwarded-Host` is
 * trusted only when it names one of the allowed domains, so a forged header
 * cannot send the login to another host.
 */

import type { IncomingRequest } from './types';

function firstForwardedValue(value: string | null): string | undefined {
  return value
    ?.split(',')
    .map((v) => v.trim())
    .find(Boolean);
}

function isAllowedHost(host: string, allowed: Set<string>): boolean {
  const h = host.toLowerCase();
  if (allowed.has(h)) return true;
  const hostname = h.split(':')[0];
  return !!hostname && allowed.has(hostname);
}

/** The request's URL; Payload's request type allows it to be missing, a real one never is. */
export function requestUrl(request: IncomingRequest): URL {
  if (!request.url) throw new Error('The request has no URL');
  return new URL(request.url);
}

export function getPublicRequestOrigin(
  request: IncomingRequest,
  allowedDomains?: string[],
): string {
  const host = request.headers.get('host') || requestUrl(request).host;

  const allowed = allowedDomains?.length
    ? new Set(allowedDomains.map((d) => d.trim().toLowerCase()).filter(Boolean))
    : undefined;

  const forwardedHost = firstForwardedValue(request.headers.get('x-forwarded-host'));
  const candidate = allowed ? forwardedHost || host : host;
  const selectedHost = allowed && !isAllowedHost(candidate, allowed) ? host : candidate;

  const forwardedProto = firstForwardedValue(request.headers.get('x-forwarded-proto'));
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : undefined;
  const protocol = proto || (selectedHost.includes('localhost') ? 'http' : 'https');

  return `${protocol}://${selectedHost}`;
}
