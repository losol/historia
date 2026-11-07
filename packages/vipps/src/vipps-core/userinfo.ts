import { Logger } from '@eventuras/logger';
import { buildHeaders, getAccessToken, type VippsConfig } from './index';

const logger = Logger.create({
  namespace: 'eventuras:vipps',
  context: { module: 'userinfoClient' },
});

export interface UserInfoAddress {
  address_type?: string;
  country?: string;
  formatted?: string;
  postal_code?: string;
  region?: string;
  street_address?: string;
}

/** Only fields covered by the user's consent are returned. Preserve [Expired] values as received. */
export interface UserInfo {
  sub: string;
  sid?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  /** YYYY-MM-DD, returned for the birthDate scope. */
  birthdate?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: UserInfoAddress;
  other_addresses?: UserInfoAddress[];
  /** Requires special permission from Vipps MobilePay. */
  nin?: string;
}

/**
 * GET /vipps-userinfo-api/userinfo/{sub} after profile-sharing consent.
 * Fetch promptly after acceptance; consented data is available for 168 hours.
 * Omits the Recurring subscription key as required by its profile-sharing guide.
 * https://developer.vippsmobilepay.com/docs/APIs/recurring-api/recurring-api-guide/#profile-sharing
 */
export async function getUserInfo(config: VippsConfig, sub: string): Promise<UserInfo> {
  const startTime = Date.now();
  let status: number | undefined;
  try {
    logger.info({}, 'Getting Vipps userinfo');
    const accessToken = await getAccessToken(config);
    const headers = buildHeaders(config, accessToken);
    delete headers['Ocp-Apim-Subscription-Key'];

    const response = await fetch(
      `${config.apiUrl}/vipps-userinfo-api/userinfo/${encodeURIComponent(sub)}`,
      { method: 'GET', headers },
    );
    status = response.status;
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get userinfo: ${response.status} - ${errorText}`);
    }
    const data = (await response.json()) as UserInfo;
    logger.info(
      { status, responseTimeMs: Date.now() - startTime },
      'Successfully retrieved Vipps userinfo',
    );
    return data;
  } catch (error) {
    // Errors can echo the subject, phone number or profile; never put them in logs.
    logger.error(
      { status, responseTimeMs: Date.now() - startTime },
      'Failed to retrieve Vipps userinfo',
    );
    throw error;
  }
}
