/**
 * Type definitions for Payload Vipps Auth Plugin
 */

import type { VippsUserInfo } from '@eventuras/fides-auth/providers/vipps';

/** Maps Vipps profile data to the user fields to create or update. */
export type VippsUserMapper = (
  vippsUser: VippsUserInfo,
  existingUser?: Record<string, unknown>,
) => Record<string, unknown>;

/**
 * Configuration options for Vipps authentication plugin
 */
export interface VippsAuthPluginConfig {
  /**
   * Vipps OAuth Client ID (required)
   */
  clientId: string;

  /**
   * Vipps OAuth Client Secret (required)
   */
  clientSecret: string;

  /**
   * OAuth redirect URI / callback URL
   * Optional: If not provided, will be computed from request origin
   * Format: {origin}/api/auth/vipps/callback
   */
  redirectUri?: string;

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
   * Default: 'openid name phoneNumber address email'
   */
  scope?: string;

  /**
   * Vipps subscription key (Ocp-Apim-Subscription-Key)
   * Required for userinfo endpoint
   */
  subscriptionKey?: string;

  /**
   * Merchant serial number
   * Required for userinfo endpoint
   */
  merchantSerialNumber?: string;

  /**
   * Whether to disable local (email/password) authentication strategy
   * Default: false
   */
  disableLocalStrategy?: boolean;

  /**
   * Whether the plugin is enabled
   * Default: true
   * Useful for conditionally enabling Vipps auth based on environment
   */
  enabled?: boolean;

  /**
   * Custom mapping function to transform Vipps user data to Payload user fields
   * Allows customization of how Vipps profile data is stored in Payload
   *
   * The result is written with a plain update, so array fields such as
   * addresses replace what the user had. Use `existingUser` to merge instead.
   *
   * @param vippsUser - User information from Vipps
   * @param existingUser - The user being logged in, or undefined when a new user
   *   is about to be created
   * @returns Partial user object to create/update in Payload
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

/**
 * Resolved configuration with defaults applied
 */
export interface ResolvedVippsAuthConfig
  extends Required<
    Omit<
      VippsAuthPluginConfig,
      | 'mapVippsUser'
      | 'subscriptionKey'
      | 'merchantSerialNumber'
      | 'redirectUri'
      | 'enabled'
      | 'apiUrl'
    >
  > {
  apiUrl: string;
  redirectUri?: string;
  mapVippsUser?: VippsUserMapper;
  subscriptionKey?: string;
  merchantSerialNumber?: string;
}
