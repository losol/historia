import * as Sentry from '@sentry/nextjs';
import { logStartupConfig } from './utilities/logStartupConfig';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Before anything logs, so errors are logged with their message and stack.
    const { configureLogger } = await import('./utilities/configureLogger');
    configureLogger();

    // Log startup configuration once on server startup
    logStartupConfig();

    // Without a usable session key no cart works. Refuse to start in production
    // rather than take orders that fail at the first click; in development, say so.
    const { sessionSecretProblem } = await import('./lib/config/sessionSecret');
    const secretProblem = sessionSecretProblem();
    if (secretProblem) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`${secretProblem}. The cart and checkout cannot work without it.`);
      }
      const { Logger } = await import('@eventuras/logger');
      Logger.create({ namespace: 'historia:startup' }).error(
        `${secretProblem}. The cart and checkout will fail until it is set.`,
      );
    }

    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
