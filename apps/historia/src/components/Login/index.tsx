import type React from 'react';
import { LoginView } from '@payloadcms/next/views';
import type { AdminViewServerProps } from 'payload';
import { getPasswordLoginEnv } from '@/lib/auth/password-login';
import { IdentityProviderLogin } from './IdentityProviderLogin';

// Replaces Payload's login view only when password login is off; the import
// map is the same either way, so the switch can be flipped without a rebuild.
const Login: React.FC<AdminViewServerProps> = (props) => {
  const { logger } = props.initPageResult.req.payload;
  const { enabled } = getPasswordLoginEnv((message) => logger.error(message));
  return enabled ? <LoginView {...props} /> : <IdentityProviderLogin {...props} />;
};

export default Login;
