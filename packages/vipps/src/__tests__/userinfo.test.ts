import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserInfo, type UserInfo, type VippsConfig } from '../vipps-core';

const logs = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));
vi.mock('@eventuras/logger', () => ({ Logger: { create: () => logs } }));

const config: VippsConfig = {
  apiUrl: 'https://apitest.vipps.no',
  clientId: 'client-id',
  clientSecret: 'secret',
  subscriptionKey: 'recurring-key',
  merchantSerialNumber: '123456',
  systemName: 'test',
  systemVersion: '1',
  pluginName: 'plugin',
  pluginVersion: '1',
};
const profile: UserInfo = {
  sub: 'subject-1',
  name: 'Ada Example',
  given_name: 'Ada',
  family_name: 'Example',
  birthdate: '2000-12-31',
  email: 'ada@example.com',
  email_verified: true,
  phone_number: '4798765432',
  phone_number_verified: true,
  address: { country: 'NO', postal_code: '0150', street_address: 'Example 1' },
  other_addresses: [],
};
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('getUserInfo', () => {
  it('uses the access token and standard headers but omits the Recurring subscription key on the GET', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'token' }));
    fetchMock.mockResolvedValueOnce(Response.json(profile));
    expect(await getUserInfo(config, 'subject/a?b')).toEqual(profile);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${config.apiUrl}/accesstoken/get`, {
      method: 'POST',
      headers: {
        client_id: 'client-id',
        client_secret: 'secret',
        'Ocp-Apim-Subscription-Key': 'recurring-key',
        'Merchant-Serial-Number': '123456',
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${config.apiUrl}/vipps-userinfo-api/userinfo/subject%2Fa%3Fb`,
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'Merchant-Serial-Number': '123456',
          'Vipps-System-Name': 'test',
          'Vipps-System-Version': '1',
          'Vipps-System-Plugin-Name': 'plugin',
          'Vipps-System-Plugin-Version': '1',
        },
      },
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(logs.info.mock.calls)).not.toContain('Ada');
    expect(JSON.stringify(logs.info.mock.calls)).not.toContain('subject');
  });

  it('preserves [Expired] redaction markers and omitted unconsented fields', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'token' }));
    fetchMock.mockResolvedValueOnce(Response.json({ sub: 'subject-1', name: '[Expired]' }));
    expect(await getUserInfo(config, 'subject-1')).toEqual({ sub: 'subject-1', name: '[Expired]' });
  });

  it('returns API errors to the caller without logging the subject or echoed profile', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'token' }));
    fetchMock.mockResolvedValueOnce(Response.json(profile, { status: 403 }));
    await expect(getUserInfo(config, profile.sub)).rejects.toThrow('Failed to get userinfo: 403');
    const logged = JSON.stringify([logs.info.mock.calls, logs.error.mock.calls]);
    for (const personal of [
      profile.sub,
      'Ada Example',
      '2000-12-31',
      '4798765432',
      'recurring-key',
    ]) {
      expect(logged).not.toContain(personal);
    }
  });

  it('stops on authentication failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Forbidden', { status: 401 }));
    await expect(getUserInfo(config, 'subject-1')).rejects.toThrow(
      'Vipps authentication failed: 401',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates network and malformed JSON failures', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'token' }));
    fetchMock.mockRejectedValueOnce(new Error('Network unavailable'));
    await expect(getUserInfo(config, 'subject-1')).rejects.toThrow('Network unavailable');
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: 'token' }));
    fetchMock.mockResolvedValueOnce(new Response('not JSON'));
    await expect(getUserInfo(config, 'subject-1')).rejects.toThrow();
  });
});
