import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';

/**
 * Whether email and password login is open, from PASSWORD_LOGIN_ENABLED.
 * Off, an identity provider is the only way into the admin; the JWT session,
 * API keys and logout are unaffected. Existing users keep their passwords, so
 * setting it back to true and restarting is the break-glass when the provider
 * is down. `warn` gets the message when the setting cannot be honoured.
 */
export function getPasswordLoginEnv(warn?: (message: string) => void): { enabled: boolean } {
  return resolvePasswordLogin({
    requested: process.env.PASSWORD_LOGIN_ENABLED !== 'false',
    identityProviderEnabled: getOidcLoginEnv().enabled || getVippsLoginEnv().enabled,
    warn,
  });
}

/** Turning password login off with no identity provider on would lock everyone out, so it stays on. */
export function resolvePasswordLogin(options: {
  requested: boolean;
  identityProviderEnabled: boolean;
  warn?: (message: string) => void;
}): { enabled: boolean } {
  if (!options.requested && !options.identityProviderEnabled) {
    options.warn?.(
      'PASSWORD_LOGIN_ENABLED=false needs OIDC_LOGIN_ENABLED=true or VIPPS_LOGIN_ENABLED=true; keeping email and password login on',
    );
    return { enabled: true };
  }
  return { enabled: options.requested };
}
