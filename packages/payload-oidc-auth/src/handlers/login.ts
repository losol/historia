/**
 * Starts a login: makes the PKCE pair, keeps the verifier in a cookie, and sends
 * the person to the provider.
 */

import { handshakeCookies, redirect, setCookieHeader } from '../cookies';
import { createLogger } from '../logger';
import { getPublicRequestOrigin, requestUrl } from '../origin';
import { RETURN_TO_PARAM, safeReturnPath } from '../return-path';
import type { IncomingRequest, OidcUserInfo, ResolvedOidcProvider } from '../types';

/** The handshake cookies live this long; a login takes seconds. */
const HANDSHAKE_MAX_AGE = 600;

export function redirectUriFor(
  provider: Pick<ResolvedOidcProvider, 'redirectUri' | 'basePath'>,
  origin: string,
): string {
  return provider.redirectUri ?? `${origin}${provider.basePath}/callback`;
}

export async function handleOidcLogin<TUser extends OidcUserInfo>(
  request: IncomingRequest,
  provider: ResolvedOidcProvider<TUser>,
  options: { allowedDomains?: string[] } = {},
): Promise<Response> {
  const log = createLogger('LoginHandler', provider.name);

  try {
    const origin = getPublicRequestOrigin(request, options.allowedDomains);
    const redirectUri = redirectUriFor(provider, origin);
    const client = provider.createClient(provider, redirectUri);

    const pkce = await client.buildPKCEOptions();
    const authUrl = await client.buildAuthorizationUrl(pkce);
    log.info({ state: pkce.state, redirectUri }, 'Redirecting to the provider');

    // The verifier is kept in a cookie, not in memory, so it survives a restart
    // and works with several instances. The redirect URI goes along so the
    // callback uses the very same one, whatever host it is reached on.
    const url = requestUrl(request);
    const secure = url.protocol === 'https:' || origin.startsWith('https:');
    const cookies = handshakeCookies(provider.name, pkce.state);
    const handshake = [
      setCookieHeader(cookies.verifier, pkce.code_verifier, { maxAge: HANDSHAKE_MAX_AGE, secure }),
      setCookieHeader(cookies.redirectUri, redirectUri, { maxAge: HANDSHAKE_MAX_AGE, secure }),
    ];
    // Where the page that started the login wants the person back, if anywhere.
    const returnTo = safeReturnPath(url.searchParams.get(RETURN_TO_PARAM), provider.basePath);
    if (returnTo) {
      handshake.push(
        setCookieHeader(cookies.returnTo, returnTo, { maxAge: HANDSHAKE_MAX_AGE, secure }),
      );
    }
    return redirect(authUrl, handshake);
  } catch (error) {
    log.error({ error }, 'Failed to start login');
    return new Response('Failed to start login', { status: 500 });
  }
}
