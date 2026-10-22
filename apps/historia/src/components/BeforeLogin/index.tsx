import type React from 'react';
import { getOidcLoginEnv } from '@/lib/oidc/login-config';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';
import { OidcLoginButton } from './OidcLoginButton';
import { VippsLoginButton } from './VippsLoginButton';

// A server component, so it can read the *_LOGIN_ENABLED variables; the buttons are
// client components.
const BeforeLogin: React.FC = () => {
  const oidc = getOidcLoginEnv();
  return (
    <div>
      <p>
        <b>Los Dash!</b>
        {' This is where site admins will log in to manage your website.'}
      </p>
      {oidc.enabled && <OidcLoginButton provider="oidc" label={oidc.label} />}
      {getVippsLoginEnv().enabled && <VippsLoginButton />}
    </div>
  );
};

export default BeforeLogin;
