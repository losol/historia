import * as Sentry from '@sentry/nextjs';
import { logStartupConfig } from './utilities/logStartupConfig';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Before anything logs, so errors are logged with their message and stack.
    const { configureLogger } = await import('./utilities/configureLogger');
    configureLogger();

    // Log startup configuration once on server startup
    logStartupConfig();

    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
