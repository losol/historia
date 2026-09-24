import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '../payload-types';
import { getClientSideURL } from './getURL';

export const getMeUser = async (args?: {
  nullUserRedirect?: string;
  validUserRedirect?: string;
}): Promise<{
  /** Absent when there is no payload-token cookie. */
  token: string | undefined;
  /** Null when not signed in, unless nullUserRedirect was given (then it redirects). */
  user: User | null;
}> => {
  const { nullUserRedirect, validUserRedirect } = args || {};
  const cookieStore = await cookies();
  const token = cookieStore.get('payload-token')?.value;

  const meUserReq = await fetch(
    `${getClientSideURL()}/api/users/me`,
    token ? { headers: { Authorization: `JWT ${token}` } } : undefined,
  );

  const body: { user?: User | null } = await meUserReq.json();
  const user = meUserReq.ok ? (body.user ?? null) : null;

  if (validUserRedirect && user) {
    redirect(validUserRedirect);
  }

  if (nullUserRedirect && !user) {
    redirect(nullUserRedirect);
  }

  return {
    token,
    user,
  };
};
