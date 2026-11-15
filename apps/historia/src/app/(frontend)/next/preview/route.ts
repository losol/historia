import configPromise from '@payload-config';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CollectionSlug, PayloadRequest } from 'payload';
import { getPayload } from 'payload';
import { canPreviewWebsite, previewSecretAccepted } from '@/access/preview';
import type { User } from '@/payload-types';
import { findWebsiteForHost } from '@/utilities/findWebsiteForHost';
import { getRequestHost } from '@/utilities/requestHost';
import { previewRefusal } from './refusal';

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise });

  const { searchParams } = new URL(req.url);

  const path = searchParams.get('path');
  const collection = searchParams.get('collection') as CollectionSlug;
  const previewSecret = searchParams.get('previewSecret');
  const host = getRequestHost(req.headers);

  // Every refusal is logged with its reason: the page shown says little on purpose.
  if (!previewSecretAccepted(previewSecret, process.env.PREVIEW_SECRET)) {
    payload.logger.warn({ host }, 'Preview refused: the link does not carry PREVIEW_SECRET');
    return previewRefusal(
      403,
      'This preview link is not valid. Open the preview from the admin again.',
    );
  }

  if (!path || !collection) {
    return previewRefusal(404, 'This preview link is incomplete.');
  }

  // A path on this site only: `//host` and `/\host` are read as another origin.
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return previewRefusal(500, 'A preview can only open a page on this website.');
  }

  let user: Awaited<ReturnType<typeof payload.auth>>['user'];

  try {
    ({ user } = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    }));
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for live preview');
    return previewRefusal(403, 'Your login could not be verified. Sign in to the admin again.');
  }

  const draft = await draftMode();

  if (!user || !('email' in user)) {
    draft.disable();
    payload.logger.warn({ host }, 'Preview refused: not signed in');
    return previewRefusal(403, 'Sign in to the admin to preview drafts.');
  }

  // Draft mode reads past access control on the website this host serves, so
  // the user needs a role on that website, or to be a system admin.
  const website = host ? await findWebsiteForHost(payload, host, { depth: 0 }) : null;
  if (!canPreviewWebsite(user as User, website?.id)) {
    draft.disable();
    payload.logger.warn(
      { host, userId: user.id, websiteId: website?.id ?? null },
      'Preview refused: the user has no role on the website of this host',
    );
    return previewRefusal(
      403,
      'Your user has no role on this website, so it cannot preview its drafts.',
    );
  }

  draft.enable();

  redirect(path);
}
