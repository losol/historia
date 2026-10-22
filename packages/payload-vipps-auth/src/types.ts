/**
 * Types for the Vipps Login provider.
 */

import type { VippsUserInfo } from '@eventuras/fides-auth/providers/vipps';
import type { OidcProvider, UserMapper } from '@eventuras/payload-oidc-auth';

export type { VippsUserInfo };

/** Maps Vipps profile data to the user fields to create or update. */
export type VippsUserMapper = UserMapper<VippsUserInfo>;

/**
 * What `vippsProvider` takes. It becomes an `OidcProvider` named `vipps` for
 * `oidcAuthPlugin`.
 */
export interface VippsProviderConfig
  extends Pick<
    OidcProvider<VippsUserInfo>,
    'redirectUri' | 'basePath' | 'allowSignup' | 'requireVerifiedEmail'
  > {
  /** Vipps OAuth Client ID (required) */
  clientId: string;

  /** Vipps OAuth Client Secret (required) */
  clientSecret: string;

  /**
   * Vipps API base URL, the same value the payments client uses
   * (`VIPPS_API_URL`). Vipps Login's OIDC issuer is this URL plus
   * `/access-management-1.0/access/`, so it is the same environment selector —
   * it does not need one of its own.
   *
   * @default 'https://apitest.vipps.no'
   */
  apiUrl?: string;

  /**
   * OpenID Connect scopes
   * @default 'openid name phoneNumber address email'
   */
  scope?: string;

  /** Vipps subscription key (Ocp-Apim-Subscription-Key), required for the userinfo endpoint */
  subscriptionKey?: string;

  /** Merchant serial number, required for the userinfo endpoint */
  merchantSerialNumber?: string;

  /**
   * Custom mapping from Vipps profile data to user fields.
   *
   * The result is written with a plain update, so array fields such as
   * addresses replace what the user had. Use `existingUser` to merge instead.
   *
   * @example
   * ```typescript
   * mapVippsUser: (vippsUser, existingUser) => ({
   *   given_name: vippsUser.given_name,
   *   family_name: vippsUser.family_name,
   * })
   * ```
   */
  mapVippsUser?: VippsUserMapper;
}
