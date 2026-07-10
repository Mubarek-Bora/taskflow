import { TEST_BASE_URL } from "../setup/config";

function randomOctet() {
  return Math.floor(Math.random() * 254) + 1;
}

/**
 * Minimal cookie-jar-aware fetch wrapper, mirroring the manual `curl -b/-c`
 * pattern used to verify every feature in this project by hand. Each client
 * gets its own fake IP so the per-IP rate limiter on /api/auth/* doesn't
 * cross-talk between unrelated tests sharing the same server process.
 */
export class TestClient {
  private cookieJar = new Map<string, string>();
  private ip = `10.${randomOctet()}.${randomOctet()}.${randomOctet()}`;

  private captureCookies(res: Response) {
    for (const raw of res.headers.getSetCookie()) {
      const pair = raw.split(";")[0];
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (value === "") {
        this.cookieJar.delete(name);
      } else {
        this.cookieJar.set(name, value);
      }
    }
  }

  private cookieHeader(): string {
    return Array.from(this.cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  hasCookie(name: string): boolean {
    return this.cookieJar.has(name);
  }

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("X-Forwarded-For", this.ip);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const cookieHeader = this.cookieHeader();
    if (cookieHeader) headers.set("Cookie", cookieHeader);

    const res = await fetch(`${TEST_BASE_URL}${path}`, {
      ...init,
      headers,
      redirect: "manual",
    });
    this.captureCookies(res);
    return res;
  }

  get(path: string) {
    return this.request(path, { method: "GET" });
  }

  post(path: string, body?: unknown) {
    return this.request(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch(path: string, body?: unknown) {
    return this.request(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete(path: string) {
    return this.request(path, { method: "DELETE" });
  }
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}
