import type { Access } from 'payload';

/**
 * Published documents for visitors; drafts too for signed-in users, since the
 * admin reads with `draft: true`. The multi-tenant plugin limits them to their
 * own websites.
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  return {
    _status: {
      equals: 'published',
    },
  };
};
