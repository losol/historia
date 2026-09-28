import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs/config';
import redirects from './redirects.js';
import {
  allowedOrigins,
  getAllowedDomainsFromAllowedOrigins,
} from './src/config/allowed-origins.ts';

const cmsUrlCandidates = [
  // Prefer explicit configuration (custom domain) when present
  process.env.NEXT_PUBLIC_CMS_URL,

  // Vercel-provided production URL can differ from the custom domain.
  // Allowlisting both avoids Next Image rejecting valid media URLs.
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,

  // Local development default
  'http://localhost:3100',
].filter(Boolean);

const allowedImageDomains = getAllowedDomainsFromAllowedOrigins(allowedOrigins) || [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // One logger for the whole server. Bundled, every route got its own copy of the
  // Logger class, so the configuration set in instrumentation.ts (error
  // serialization) never reached the loggers in routes and server actions.
  serverExternalPackages: ['@eventuras/logger'],

  experimental: {
    serverActions: {
      // Increased from default 1mb to 10mb to support rich text content with:
      // - Multiple embedded images and media
      // - Large text content with formatting
      // - Complex nested content structures
      // This limit applies to all Server Actions payloads
      bodySizeLimit: '10mb',
    },
  },

  images: {
    // Next 16 refuses to optimize images from local addresses, a guard against SSRF.
    // In `next dev` the media are served from localhost itself, so allow it there
    // and nowhere else: not in production, test or any other environment.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    remotePatterns: [
      ...allowedImageDomains.map((hostname) => ({
        protocol: 'https',
        hostname,
      })),
      ...allowedImageDomains.map((hostname) => ({
        protocol: 'http',
        hostname,
      })),
      // Always allow the CMS URL(s)
      ...cmsUrlCandidates.map((item) => {
        const url = new URL(item);
        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        };
      }),
    ],
  },
  reactStrictMode: true,
  redirects,
};

// Compose the configurations: Sentry wraps Payload
export default withSentryConfig(withPayload(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.CMS_SENTRY_ORG,
  project: process.env.CMS_SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Name the release after the commit the image is built from (a Docker build arg),
  // so events and the uploaded source maps match. Outside Docker the plugin falls
  // back to detecting the commit from git.
  release: process.env.HISTORIA_REVISION ? { name: process.env.HISTORIA_REVISION } : undefined,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
