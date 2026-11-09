import { APIError, type CollectionBeforeOperationHook } from 'payload';
import { getPasswordLoginEnv } from '@/lib/auth/password-login';

/** The operations that only exist for email and password login. */
const PASSWORD_OPERATIONS = new Set<string>(['login', 'forgotPassword', 'resetPassword']);

/**
 * Refuses password login, forgot and reset password when PASSWORD_LOGIN_ENABLED
 * is false. Runs before the user is looked up, and covers REST, GraphQL and the
 * local API alike. The first user on an empty install is let in: Payload's
 * first-register creates the user and logs it in on the same request.
 */
export const refusePasswordLogin: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== 'create' && !PASSWORD_OPERATIONS.has(operation)) return args;
  const { enabled } = getPasswordLoginEnv((message) => req.payload.logger.error(message));
  if (enabled) return args;

  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({ collection: 'users' });
    if (totalDocs === 0) req.context.firstUserLogin = true;
    return args;
  }
  if (operation === 'login' && req.context.firstUserLogin) return args;

  throw new APIError('Email and password login is turned off on this install', 403);
};
