/**
 * Types for the OpenID Connect login plugin.
 */

import type { PKCEOptions } from '@eventuras/fides-auth/oauth';
import type { TokenEndpointResponse } from 'openid-client';

/** What the handlers read from a request: a `Request`, or Payload's `PayloadRequest`. */
export type IncomingRequest = { url?: string; headers: Headers };

/**
 * What a provider tells us about the person who logged in: the standard OIDC
 * claims the plugin itself reads. A provider's own user type extends it with
 * what else it returns, for `mapUser` to pick from.
 */
export interface OidcUserInfo {
  /** The provider's stable identifier for the user. */
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * The provider-facing side of a login: start it, finish it, and read who logged
 * in. The default client speaks plain OIDC through fides-auth; a provider that
 * needs something of its own (extra headers, a non-standard userinfo call)
 * supplies its own through `OidcProvider.createClient`.
 */
export interface OidcClient<TUser extends OidcUserInfo = OidcUserInfo> {
  buildPKCEOptions(): Promise<PKCEOptions>;
  buildAuthorizationUrl(pkce: PKCEOptions): Promise<URL>;
  exchangeCodeForTokens(
    callbackUrl: URL,
    codeVerifier: string,
    expectedState: string,
  ): Promise<TokenEndpointResponse>;
  getUserInfo(tokens: TokenEndpointResponse): Promise<TUser>;
}

/** Maps what the provider returned to the fields to create or update on the user. */
export type UserMapper<TUser extends OidcUserInfo = OidcUserInfo> = (
  user: TUser,
  existingUser?: Record<string, unknown>,
) => Record<string, unknown>;

/** The settings every provider gets after `resolveProvider` applied the defaults. */
export interface ResolvedOidcProvider<TUser extends OidcUserInfo = OidcUserInfo> {
  name: string;
  label: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  redirectUri?: string;
  basePath: string;
  allowSignup: boolean;
  requireVerifiedEmail: boolean;
  mapUser?: UserMapper<TUser>;
  createClient: (config: ResolvedOidcProvider<TUser>, redirectUri: string) => OidcClient<TUser>;
}

/** One identity provider. */
export interface OidcProvider<TUser extends OidcUserInfo = OidcUserInfo> {
  /**
   * Short name, used in URLs (`/api/auth/{name}/login`), in cookie names, as the
   * strategy name and on the user's identity row. Lowercase letters, digits and
   * dashes.
   */
  name: string;

  /** Shown on buttons and in logs. Defaults to the name. */
  label?: string;

  /** The OIDC issuer, where `.well-known/openid-configuration` is discovered. */
  issuer: string;

  clientId: string;
  clientSecret: string;

  /** @default 'openid profile email' */
  scope?: string;

  /**
   * The callback URL registered with the provider. By default it is computed per
   * request from the public origin, which serves several domains from one
   * deployment. Set it to pin one.
   */
  redirectUri?: string;

  /**
   * Where the provider's routes live. @default `/api/auth/${name}`
   */
  basePath?: string;

  /**
   * Whether a person the provider vouches for, but who has no user yet, gets one.
   * @default true
   */
  allowSignup?: boolean;

  /**
   * Whether the provider must report the email as verified before it is used to
   * find an existing user or create one. Off, anyone who can register another
   * person's email with the provider can take over that person's account.
   * @default true
   */
  requireVerifiedEmail?: boolean;

  /**
   * The fields to write on the user, from what the provider returned. The result
   * is a plain update, so array fields replace what was there; `existingUser` is
   * there for merging. Without it, the standard claims (email, email_verified,
   * given_name, family_name) are written.
   */
  mapUser?: UserMapper<TUser>;

  /** A provider-specific client. See `OidcClient`. */
  createClient?: (config: ResolvedOidcProvider<TUser>, redirectUri: string) => OidcClient<TUser>;
}

export interface OidcAuthPluginConfig {
  // biome-ignore lint/suspicious/noExplicitAny: each provider carries its own user-info type
  providers: OidcProvider<any>[];

  /** @default true */
  enabled?: boolean;

  /** The auth-enabled collection the providers log in to. @default 'users' */
  usersCollection?: string;

  /**
   * The hosts the deployment answers on. With a list, `X-Forwarded-Host` is
   * trusted when it names one of them, so the redirect URI matches the domain the
   * person is on. Without one, only the request's own host is used.
   */
  allowedDomains?: string[] | (() => string[] | undefined);

  /** Where to send the person after login. @default '/admin' */
  successPath?: string;

  /**
   * Where to send the person when login fails. `{error}` is replaced by a short
   * error code. @default '/admin/login?error={error}'
   */
  errorPath?: string;
}

export interface ResolvedOidcAuthPluginConfig {
  providers: ResolvedOidcProvider[];
  usersCollection: string;
  allowedDomains?: string[] | (() => string[] | undefined);
  successPath: string;
  errorPath: string;
}

/** Short codes the error redirect carries. */
export type OidcLoginError =
  | 'oauth_failed'
  | 'invalid_callback'
  | 'invalid_state'
  | 'token_failed'
  | 'no_email'
  | 'email_not_verified'
  | 'signup_disabled'
  | 'user_creation_failed'
  | 'callback_failed'
  | 'auth_failed';
