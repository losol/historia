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

  async update(collection: string, id: string, data: Record<string, unknown>): Promise<Doc> {
    const { doc } = await this.request<{ doc: Doc }>('PATCH', `/api/${collection}/${id}`, data);
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
