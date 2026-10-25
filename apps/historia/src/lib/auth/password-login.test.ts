import { describe, expect, it } from 'vitest';
import { resolvePasswordLogin } from './password-login';

describe('resolvePasswordLogin', () => {
  it('is on by default', () => {
    expect(resolvePasswordLogin({ requested: true, identityProviderEnabled: false })).toEqual({
      enabled: true,
    });
  });

  it('goes off when an identity provider is on', () => {
    expect(resolvePasswordLogin({ requested: false, identityProviderEnabled: true })).toEqual({
      enabled: false,
    });
  });

  it('stays on, with a warning, when turning it off would lock everyone out', () => {
    const warnings: string[] = [];
    const result = resolvePasswordLogin({
      requested: false,
      identityProviderEnabled: false,
      warn: (message) => warnings.push(message),
    });
    expect(result).toEqual({ enabled: true });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('OIDC_LOGIN_ENABLED');
  });
});
