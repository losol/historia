/**
 * Turns the pending-session cookie into a Payload session. `payload.auth` runs
 * the strategies, the provider's strategy reads the cookie, and the JWT and
 * cookie Payload's own login would set are made here.
 */

import type { Payload, TypedUser } from 'payload';
import { generatePayloadCookie, jwtSign } from 'payload';
import { redirect } from '../cookies';
import { getPublicRequestOrigin } from '../origin';
import type { IncomingRequest } from '../types';
import { errorRedirect } from './callback';

export interface SessionOptions {
  collection: string;
  allowedDomains?: string[];
  successPath: string;
  errorPath: string;
  /**
   * The user Payload already authenticated for this request (`req.user` in an
   * endpoint). Given, the strategies are not run a second time, which would
   * open a second session for the same login.
   */
  user?: TypedUser | null;
}

export async function handleOidcSession(
  request: IncomingRequest,
  payload: Payload,
  options: SessionOptions,
): Promise<Response> {
  const origin = getPublicRequestOrigin(request, options.allowedDomains);

  const user = options.user ?? (await payload.auth({ headers: request.headers })).user;
  if (!user) {
    return errorRedirect(options.errorPath, origin, 'auth_failed');
  }

  const collection = payload.collections[options.collection];
  if (!collection) {
    throw new Error(`Collection "${options.collection}" not found`);
  }
  const authConfig = collection.config.auth;

  const { token } = await jwtSign({
    fieldsToSign: {
      _strategy: user._strategy ?? undefined,
      collection: options.collection,
      email: user.email,
      id: user.id,
      sid: user._sid ?? undefined,
    },
    // The key Payload's own JWT strategy verifies with.
    secret: payload.secret,
    tokenExpiration: authConfig.tokenExpiration,
  });

  const cookie = generatePayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  });

  return redirect(new URL(options.successPath, origin), [cookie]);
}
