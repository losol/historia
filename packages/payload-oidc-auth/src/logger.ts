import { Logger } from '@eventuras/logger';

/** A logger for one module, with the provider on every line. */
export function createLogger(module: string, provider?: string): Logger {
  return Logger.create({
    namespace: 'payload-oidc-auth',
    context: provider ? { module, provider } : { module },
  });
}
