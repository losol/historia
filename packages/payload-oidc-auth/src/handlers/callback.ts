/**
 * Finishes a login: trades the code for tokens, reads who logged in, finds or
 * creates the user, and hands the login to the strategy through a short-lived
 * encrypted cookie.
 */

import { createEncryptedJWT, getSessionSecret } from '@eventuras/fides-auth/utils';
import type { Payload } from 'payload';
import {
  clearCookieHeader,
  getCookie,
  handshakeCookies,
  isValidState,
  pendingSessionCookie,
  redirect,
  setCookieHeader,
} from '../cookies';
import { createLogger } from '../logger';
import { getPublicRequestOrigin, requestUrl } from '../origin';
import type { IncomingRequest, OidcLoginError, OidcUserInfo, ResolvedOidcProvider } from '../types';
import { findOrCreateUser, OidcLoginFailure } from '../users';
import { redirectUriFor } from './login';

/** The strategy must pick the login up within this many seconds. */
const PENDING_SESSION_MAX_AGE = 60;

export interface CallbackOptions {
  collection: string;
  allowedDomains?: string[];
  /** Where a failed login goes; `{error}` is replaced by the code. */
  errorPath: string;
}

/** What the callback leaves for the strategy. */
export interface PendingSession {
  provider: string;
  user: { id: string | number; email?: string };
  /** Epoch milliseconds. The cookie's Max-Age is only honoured by browsers. */
  expiresAt: number;
}

export function errorRedirect(errorPath: string, origin: string, error: OidcLoginError): Response {
  return redirect(new URL(errorPath.replace('{error}', error), origin));
}

export async function handleOidcCallback<TUser extends OidcUserInfo>(
  request: IncomingRequest,
  provider: ResolvedOidcProvider<TUser>,
  payload: Payload,
  options: CallbackOptions,
): Promise<Response> {
  const log = createLogger('CallbackHandler', provider.name);
  const url = requestUrl(request);
  const origin = getPublicRequestOrigin(request, options.allowedDomains);
  const secure = url.protocol === 'https:' || origin.startsWith('https:');
  const fail = (error: OidcLoginError) => errorRedirect(options.errorPath, origin, error);

  const rawState = url.searchParams.get('state');
  const state = isValidState(rawState) ? rawState : undefined;
  const cookies = state ? handshakeCookies(provider.name, state) : undefined;
  const clearHandshake = cookies
    ? [clearCookieHeader(cookies.verifier, secure), clearCookieHeader(cookies.redirectUri, secure)]
    : [];
  const withClearedHandshake = (response: Response) => {
    for (const cookie of clearHandshake) response.headers.append('Set-Cookie', cookie);
    return response;
  };

  try {
    const code = url.searchParams.get('code');
    const oauthError = url.searchParams.get('error');

    if (oauthError) {
      log.error(
        { error: oauthError, description: url.searchParams.get('error_description') },
        'The provider reported an error',
      );
      return withClearedHandshake(fail('oauth_failed'));
    }
    if (!code || !state || !cookies) {
      log.error({ hasCode: !!code, hasState: !!rawState }, 'The callback has no code or state');
      return withClearedHandshake(fail('invalid_callback'));
    }

    const codeVerifier = getCookie(request, cookies.verifier);
    if (!codeVerifier) {
      log.error({ state }, 'No verifier for this state: the login expired or was not started here');
      return withClearedHandshake(fail('invalid_state'));
    }

    // The redirect URI from the login, so the token exchange matches it exactly
    // even when the callback is reached on an internal address.
    const redirectUri = getCookie(request, cookies.redirectUri) ?? redirectUriFor(provider, origin);
    const client = provider.createClient(provider, redirectUri);

    const callbackUrl = new URL(redirectUri);
    callbackUrl.search = url.search;
    const tokens = await client.exchangeCodeForTokens(callbackUrl, codeVerifier, state);
    if (!tokens.access_token) {
      log.error('The token response has no access token');
      return withClearedHandshake(fail('token_failed'));
    }

    const userInfo = await client.getUserInfo(tokens);
    const user = await findOrCreateUser({
      payload,
      collection: options.collection,
      provider,
      userInfo,
    });

    const pending: PendingSession = {
      provider: provider.name,
      user: { id: user.id, email: user.email },
      expiresAt: Date.now() + PENDING_SESSION_MAX_AGE * 1000,
    };
    const sessionToken = await createEncryptedJWT(pending, getSessionSecret());

    log.info({ userId: user.id }, 'Login succeeded, handing over to the session route');
    return withClearedHandshake(
      redirect(new URL(`${provider.basePath}/session`, new URL(redirectUri).origin), [
        setCookieHeader(pendingSessionCookie(provider).name, sessionToken, {
          maxAge: PENDING_SESSION_MAX_AGE,
          secure,
          path: pendingSessionCookie(provider).path,
        }),
      ]),
    );
  } catch (error) {
    if (error instanceof OidcLoginFailure) {
      log.warn({ code: error.code, reason: error.message }, 'Login refused');
      return withClearedHandshake(fail(error.code));
    }
    log.error({ error }, 'Failed to finish login');
    return withClearedHandshake(fail('callback_failed'));
  }
}
