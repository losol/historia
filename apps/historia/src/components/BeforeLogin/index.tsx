import type React from 'react';
import { getVippsLoginEnv } from '@/lib/vipps/login-config';
import { VippsLoginButton } from './VippsLoginButton';

// A server component, so it can read VIPPS_LOGIN_ENABLED; the button itself is a client
// component (see ./VippsLoginButton).
const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Los Dash!</b>
        {' This is where site admins will log in to manage your website.'}
      </p>
      {getVippsLoginEnv().enabled && <VippsLoginButton />}
    </div>
  );
};

export default BeforeLogin;
