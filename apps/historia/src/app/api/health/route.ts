import { NextResponse } from 'next/server';

/**
 * Health check endpoint for container orchestration.
 * Returns 200 OK if the application is running, with the version and commit it was
 * built from, so a deploy can tell the new pod from the old one. Both come from the
 * image (see the Dockerfile) and are null outside it, e.g. in `pnpm dev`.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'historia',
      version: process.env.HISTORIA_VERSION || null,
      revision: process.env.HISTORIA_REVISION || null,
    },
    { status: 200 },
  );
}
