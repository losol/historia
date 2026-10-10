import { HistoriaError } from './errors';
import { createProductsApi, type ProductsApi } from './products';

export interface HistoriaClientOptions {
  /**
   * The address of the Historia website to read from, e.g. `https://shop.example.com`.
   * Historia answers each domain with that website's content only, so this must be
   * one of the website's own domains, not the CMS admin's.
   */
  baseUrl: string;
  /** Content language, e.g. `no` or `en`. Default: `no`. */
  locale?: string;
  /** Your own fetch, e.g. one with caching or tracing. Default: the global fetch. */
  fetch?: typeof fetch;
  /** Extra headers on every request. */
  headers?: Record<string, string>;
  /** Give up on a request after this many milliseconds. Default: 10 000. */
  timeoutMs?: number;
}

export interface RequestOptions {
  /** Cancel the request. */
  signal?: AbortSignal;
}

export interface HistoriaClient {
  readonly baseUrl: string;
  readonly locale: string;
  readonly products: ProductsApi;
}

type QueryValue = string | number | boolean | null | undefined | QueryObject | QueryValue[];
interface QueryObject {
  [key: string]: QueryValue;
}

/** Payload's query string: nested keys in brackets, `where[slug][equals]=x`. */
export function toQueryString(params: QueryObject): string {
  const parts: string[] = [];
  const add = (key: string, value: QueryValue) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      // Conditions (`where[and][0]...`) are indexed; plain values, as for `in`, are
      // joined with commas, which Payload splits again.
      if (value.some((item) => typeof item === 'object' && item !== null)) {
        for (const [index, item] of value.entries()) add(`${key}[${index}]`, item);
      } else {
        add(key, value.join(','));
      }
    } else if (typeof value === 'object') {
      for (const [child, childValue] of Object.entries(value)) add(`${key}[${child}]`, childValue);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  };
  for (const [key, value] of Object.entries(params)) add(key, value);
  return parts.join('&');
}

/** The internal request function the APIs share. */
export type Requester = <T>(
  path: string,
  query: QueryObject,
  options?: RequestOptions,
) => Promise<T>;

export function createHistoriaClient(options: HistoriaClientOptions): HistoriaClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new TypeError(`baseUrl must be an http(s) URL, got "${options.baseUrl}"`);
  }
  const locale = options.locale ?? 'no';
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) throw new TypeError('No fetch available: pass `fetch` in the options');
  const timeoutMs = options.timeoutMs ?? 10_000;

  const request: Requester = async (path, query, requestOptions = {}) => {
    const url = `${baseUrl}${path}?${toQueryString(query)}`;
    const { signal, cancel } = withTimeout(requestOptions.signal, timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: 'application/json', ...options.headers },
        signal,
      });
    } catch (error) {
      const reason = signal.aborted ? 'timed out or was aborted' : 'failed';
      throw new HistoriaError(`Request to Historia ${reason}`, { status: 0, url, cause: error });
    } finally {
      cancel();
    }

    if (!response.ok) {
      let message = await errorMessage(response);
      // Historia refuses reads on a domain no website is configured for.
      if (response.status === 403) {
        message += ` (is ${baseUrl} one of the website's domains in Historia?)`;
      }
      throw new HistoriaError(message, { status: response.status, url });
    }
    return (await response.json()) as never;
  };

  return {
    baseUrl,
    locale,
    products: createProductsApi({ request, baseUrl, locale }),
  };
}

/** Payload answers errors as `{ errors: [{ message }] }`. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { errors?: Array<{ message?: string }> };
    const message = body.errors?.[0]?.message;
    if (message) return `Historia answered ${response.status}: ${message}`;
  } catch {
    // Not JSON: fall through to the status line.
  }
  return `Historia answered ${response.status} ${response.statusText}`.trim();
}

/** The caller's signal, also aborted after `timeoutMs`. */
function withTimeout(
  callerSignal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  callerSignal?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', onAbort);
    },
  };
}
