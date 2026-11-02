import configPromise from '@payload-config';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CollectionSlug, PayloadRequest } from 'payload';
import { getPayload } from 'payload';
import { canPreviewWebsite } from '@/access/adminAccess';
import type { User } from '@/payload-types';
import { findWebsiteForHost } from '@/utilities/findWebsiteForHost';
import { getRequestHost } from '@/utilities/requestHost';

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise });

  const { searchParams } = new URL(req.url);

  const path = searchParams.get('path');
  const collection = searchParams.get('collection') as CollectionSlug;
  const previewSecret = searchParams.get('previewSecret');

  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  if (!path || !collection) {
    return new Response('Insufficient search params', { status: 404 });
  }

  if (!path.startsWith('/')) {
    return new Response('This endpoint can only be used for relative previews', { status: 500 });
  }

  let user: Awaited<ReturnType<typeof payload.auth>>['user'];

  try {
    ({ user } = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    }));
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview');
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  const draft = await draftMode();

  if (!user || !('email' in user)) {
    draft.disable();
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  // Draft mode reads past access control on the website this host serves, so
  // being logged in is not enough: anyone can be, through an identity provider.
  // The user needs a role on that website, or to be a system admin.
  const host = getRequestHost(req.headers);
  const website = host ? await findWebsiteForHost(payload, host, { depth: 0 }) : null;
  if (!canPreviewWebsite(user as User, website?.id ?? null)) {
    draft.disable();
    return new Response('You are not allowed to preview this page', { status: 403 });
  }

  draft.enable();

  redirect(path);
}
