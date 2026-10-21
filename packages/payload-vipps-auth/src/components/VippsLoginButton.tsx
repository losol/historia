/**
 * "Logg inn med Vipps" for Payload's login page: the OIDC login button in
 * Vipps orange.
 *
 * @example
 * ```typescript
 * admin: { components: { beforeLogin: [VippsLoginButton] } }
 * ```
 */

'use client';

import type React from 'react';
import { OidcLoginButton } from '@eventuras/payload-oidc-auth/client';

export interface VippsLoginButtonProps {
  /** @default 'Logg inn med Vipps' */
  buttonText?: string;
  /** @default 'eller bruk e-post og passord nedenfor' */
  helperText?: string;
  /** @default '/api/auth/vipps/login' */
  loginPath?: string;
}

export const VippsLoginButton: React.FC<VippsLoginButtonProps> = ({
  buttonText = 'Logg inn med Vipps',
  helperText,
  loginPath,
}) => (
  <OidcLoginButton
    provider="vipps"
    label={buttonText}
    helperText={helperText}
    loginPath={loginPath}
    color="#FF5B24"
    hoverColor="#E54E1F"
    icon={
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          fill="white"
        />
      </svg>
    }
  />
);
