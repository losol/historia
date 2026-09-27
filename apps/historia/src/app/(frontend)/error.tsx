'use client';

import { useEffect } from 'react';
import { ErrorBlock } from '@eventuras/ratio-ui/blocks/Error';
import { Link } from '@eventuras/ratio-ui-next';
import * as Sentry from '@sentry/nextjs';

/**
 * Segment-level boundary for the public site.
 *
 * Without this, a throw anywhere under (frontend) climbs all the way to
 * `app/global-error.tsx`, which replaces the whole document — header, nav,
 * footer and all. A single failing query then looks like the entire site being
 * down. This keeps the layout mounted and swaps out only the page body, so the
 * rest of the site stays navigable.
 *
 * What it does not do: bring the page's own content back. Pages populate media
 * through `depth: 3`, so a broken media column fails the parent query itself —
 * there is no partial result to render. Isolating a single image would mean
 * fetching media separately from its document.
 */
export default function FrontendError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorBlock type="server-error">
      <ErrorBlock.Title>Something went wrong</ErrorBlock.Title>
      <ErrorBlock.Description>
        This page could not be loaded. The rest of the site should still work.
      </ErrorBlock.Description>
      {/* The digest is what correlates this render with the server log and the
      Sentry event, so it is the one technical detail worth surfacing. */}
      {error.digest ? <ErrorBlock.Details>Reference: {error.digest}</ErrorBlock.Details> : null}
      <ErrorBlock.Actions>
        <button type="button" onClick={reset}>
          Try again
        </button>
        <Link href="/" variant="button-primary">
          Go home
        </Link>
      </ErrorBlock.Actions>
    </ErrorBlock>
  );
}
