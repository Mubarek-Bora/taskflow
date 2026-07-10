import { describe, it, expect } from "vitest";
import { TestClient } from "./helpers/client";

describe("oauth", () => {
  it("404s for an unknown provider", async () => {
    const client = new TestClient();
    expect((await client.get("/api/auth/oauth/facebook/start")).status).toBe(404);
    expect((await client.get("/api/auth/oauth/facebook/callback")).status).toBe(404);
  });

  it("start redirects to the provider's authorize URL with a state cookie", async () => {
    const client = new TestClient();
    const res = await client.get("/api/auth/oauth/google/start");

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    expect(location).toContain("response_type=code");
    expect(location).toContain(
      `redirect_uri=${encodeURIComponent("http://localhost:3000/api/auth/oauth/google/callback")}`
    );
    expect(client.hasCookie("taskflow_oauth_state")).toBe(true);
  });

  it("start builds the correct GitHub authorize URL", async () => {
    const client = new TestClient();
    const res = await client.get("/api/auth/oauth/github/start");

    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
    expect(location).toContain("scope=read%3Auser+user%3Aemail");
  });

  it("callback redirects to /login with error=oauth_denied when the provider reports an error", async () => {
    const client = new TestClient();
    const res = await client.get("/api/auth/oauth/google/callback?error=access_denied");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=oauth_denied");
  });

  it("callback redirects to /login with error=oauth_failed when state is missing or wrong", async () => {
    const client = new TestClient();
    const res = await client.get("/api/auth/oauth/google/callback?code=fake&state=bogus");

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=oauth_failed");
  });

  it("callback redirects to /login with error=oauth_failed when code is missing", async () => {
    const client = new TestClient();
    const startRes = await client.get("/api/auth/oauth/google/start");
    const state = new URL(startRes.headers.get("location")!).searchParams.get("state")!;

    const res = await client.get(`/api/auth/oauth/google/callback?state=${state}`);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=oauth_failed");
  });
});
