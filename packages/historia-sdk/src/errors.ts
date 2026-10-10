/**
 * A request to Historia failed. `status` is the HTTP status, or 0 when no answer
 * came back (network error, timeout, aborted).
 */
export class HistoriaError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, options: { status: number; url: string; cause?: unknown }) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'HistoriaError';
    this.status = options.status;
    this.url = options.url;
  }
}
