import { Logger, type LogLevel, PinoTransport } from '@eventuras/logger';

const LOG_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/**
 * An Error as plain JSON. Pino only serializes Errors under the key `err`, and an
 * Error's `message` and `stack` are not enumerable, so `logger.error({ error })`
 * (the form used throughout the app) otherwise logs `"error": {}`: the one line
 * that should say what failed says nothing.
 */
function serializeError(value: unknown): unknown {
  if (!(value instanceof Error)) return value;
  return {
    type: value.name,
    message: value.message,
    stack: value.stack,
    ...(value.cause !== undefined && { cause: serializeError(value.cause) }),
  };
}

/**
 * Replaces the logger's default transport with one that serializes errors. The
 * rest matches `@eventuras/logger`'s defaults: level from LOG_LEVEL and the same
 * redacted fields. It stays a PinoTransport, so the OpenTelemetry export set up
 * in sentry.server.config.ts keeps receiving the lines.
 */
export function configureLogger(): void {
  const level = LOG_LEVELS.find((candidate) => candidate === process.env.LOG_LEVEL) ?? 'info';
  Logger.configure({
    transport: new PinoTransport({
      level,
      redact: ['password', 'token', 'apiKey', 'authorization', 'secret'],
      pinoOptions: {
        serializers: { error: serializeError, err: serializeError },
      },
    }),
  });
}
