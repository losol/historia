import { describe, expect, it } from 'vitest';
import { DEFAULT_VIPPS_API_URL, resolveApiUrl } from '../vipps-core';

describe('resolveApiUrl', () => {
  it('falls back to the test environment when unset', () => {
    expect(resolveApiUrl(undefined)).toBe(DEFAULT_VIPPS_API_URL);
    expect(resolveApiUrl(null)).toBe(DEFAULT_VIPPS_API_URL);
    expect(resolveApiUrl('')).toBe(DEFAULT_VIPPS_API_URL);
  });

  it('never defaults to production', () => {
    expect(DEFAULT_VIPPS_API_URL).toBe('https://apitest.vipps.no');
  });

  it('treats a blank value as unset rather than as an empty base URL', () => {
    expect(resolveApiUrl('   ')).toBe(DEFAULT_VIPPS_API_URL);
    expect(resolveApiUrl('\t\n')).toBe(DEFAULT_VIPPS_API_URL);
  });

  it('passes a well-formed URL through unchanged', () => {
    expect(resolveApiUrl('https://api.vipps.no')).toBe('https://api.vipps.no');
  });

  it('trims surrounding whitespace', () => {
    expect(resolveApiUrl('  https://api.vipps.no  ')).toBe('https://api.vipps.no');
  });

  // Callers build endpoints as `${apiUrl}/...`, so a trailing slash would
  // produce `//accesstoken/get`. Vipps routes on the exact path, so that is a
  // 404 rather than a cosmetic difference.
  it('strips trailing slashes so concatenated paths stay single-slashed', () => {
    expect(resolveApiUrl('https://api.vipps.no/')).toBe('https://api.vipps.no');
    expect(resolveApiUrl('https://api.vipps.no///')).toBe('https://api.vipps.no');
    expect(resolveApiUrl('  https://api.vipps.no/  ')).toBe('https://api.vipps.no');
  });

  it('leaves a path prefix intact apart from its trailing slash', () => {
    expect(resolveApiUrl('https://proxy.internal/vipps/')).toBe('https://proxy.internal/vipps');
  });
});
