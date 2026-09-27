// A small client for Historia's REST API, just enough for the demo seed.
// It goes through the running app on purpose: collection hooks (revalidation,
// the first user becoming system-admin) and access control run as they do for
// real users, which Payload's Local API outside Next would not do.

export type Doc = { id: string; [key: string]: unknown };

type ListResponse = { docs: Doc[]; totalDocs: number };

export class HistoriaClient {
  readonly baseUrl: string;
  private token: string | undefined;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Polls until Payload answers, since `next dev` compiles routes on first request. */
  async waitUntilReady(timeoutMs = 5 * 60_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastError = 'no response';
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${this.baseUrl}/api/users/me`, {
          signal: AbortSignal.timeout(60_000),
        });
        if (res.ok) return;
        lastError = `HTTP ${res.status}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }
    throw new Error(`Historia at ${this.baseUrl} did not become ready: ${lastError}`);
  }

  /** Whether the database has any users yet. */
  async hasUsers(): Promise<boolean> {
    const { initialized } = await this.request<{ initialized: boolean }>('GET', '/api/users/init');
    return initialized;
  }

  /** Creates the first user, who becomes system-admin, and signs in as them. */
  async registerFirstUser(email: string, password: string): Promise<void> {
    const { token } = await this.request<{ token: string }>('POST', '/api/users/first-register', {
      email,
      password,
    });
    this.token = token;
  }

  async login(email: string, password: string): Promise<void> {
    const { token } = await this.request<{ token: string }>('POST', '/api/users/login', {
      email,
      password,
    });
    this.token = token;
  }

  async count(collection: string): Promise<number> {
    const { totalDocs } = await this.request<ListResponse>('GET', `/api/${collection}?limit=1`);
    return totalDocs;
  }

  async create(collection: string, data: Record<string, unknown>): Promise<Doc> {
    const { doc } = await this.request<{ doc: Doc }>('POST', `/api/${collection}`, data);
    return doc;
  }

  /**
   * Uploads a file to an upload collection (e.g. media). Payload takes the file and,
   * as JSON in `_payload`, the document's other fields.
   */
  async upload(
    collection: string,
    file: { name: string; type: string; data: Uint8Array },
    data: Record<string, unknown>,
  ): Promise<Doc> {
    const form = new FormData();
    // A copy on a plain ArrayBuffer, which is what Blob takes.
    form.append('file', new Blob([new Uint8Array(file.data)], { type: file.type }), file.name);
    form.append('_payload', JSON.stringify(data));
    const res = await fetch(`${this.baseUrl}/api/${collection}`, {
      method: 'POST',
      headers: this.token ? { Authorization: `JWT ${this.token}` } : {},
      body: form,
    });
    const text = await res.text();
    if (!res.ok)
      throw new Error(`POST /api/${collection} (upload) failed with ${res.status}: ${text}`);
    return (JSON.parse(text) as { doc: Doc }).doc;
  }

  /** Updates a document; with `locale`, only that locale's values of localized fields. */
  async update(
    collection: string,
    id: string,
    data: Record<string, unknown>,
    locale?: string,
  ): Promise<Doc> {
    const query = locale ? `?locale=${locale}` : '';
    const { doc } = await this.request<{ doc: Doc }>(
      'PATCH',
      `/api/${collection}/${id}${query}`,
      data,
    );
    return doc;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.token) headers.Authorization = `JWT ${this.token}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} failed with ${res.status}: ${text}`);
    return JSON.parse(text) as T;
  }
}
