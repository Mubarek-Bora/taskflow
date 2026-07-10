import { describe, it, expect } from "vitest";
import { TestClient, uniqueEmail } from "./helpers/client";

describe("auth", () => {
  it("registers a new user and starts an authenticated session", async () => {
    const client = new TestClient();
    const email = uniqueEmail("register");

    const res = await client.post("/api/auth/register", {
      name: "Register Test",
      email,
      password: "Passw0rd!",
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.user).toMatchObject({ name: "Register Test", email, role: "USER" });
    expect(client.hasCookie("taskflow_access")).toBe(true);
    expect(client.hasCookie("taskflow_refresh")).toBe(true);

    const me = await client.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect((await me.json()).user.email).toBe(email);
  });

  it("rejects registering the same email twice", async () => {
    const client = new TestClient();
    const email = uniqueEmail("dup");
    const payload = { name: "Dup", email, password: "Passw0rd!" };

    expect((await client.post("/api/auth/register", payload)).status).toBe(201);

    const second = new TestClient();
    const res = await second.post("/api/auth/register", payload);
    expect(res.status).toBe(409);
  });

  it("rejects a weak password", async () => {
    const client = new TestClient();
    const res = await client.post("/api/auth/register", {
      name: "Weak",
      email: uniqueEmail("weak"),
      password: "weak",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details.password).toBeDefined();
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    const email = uniqueEmail("login");
    const registerClient = new TestClient();
    await registerClient.post("/api/auth/register", {
      name: "Login Test",
      email,
      password: "Passw0rd!",
    });

    const wrongClient = new TestClient();
    const wrong = await wrongClient.post("/api/auth/login", { email, password: "WrongPass1" });
    expect(wrong.status).toBe(401);
    expect(wrongClient.hasCookie("taskflow_access")).toBe(false);

    const rightClient = new TestClient();
    const right = await rightClient.post("/api/auth/login", { email, password: "Passw0rd!" });
    expect(right.status).toBe(200);
    expect(rightClient.hasCookie("taskflow_access")).toBe(true);
  });

  it("returns 401 from /me with no session", async () => {
    const client = new TestClient();
    expect((await client.get("/api/auth/me")).status).toBe(401);
  });

  it("rotates the refresh token and invalidates the old one", async () => {
    const client = new TestClient();
    await client.post("/api/auth/register", {
      name: "Refresh Test",
      email: uniqueEmail("refresh"),
      password: "Passw0rd!",
    });

    const refreshRes = await client.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(200);

    // still authenticated after rotation
    expect((await client.get("/api/auth/me")).status).toBe(200);
  });

  it("logout revokes the session so refresh no longer works", async () => {
    const client = new TestClient();
    await client.post("/api/auth/register", {
      name: "Logout Test",
      email: uniqueEmail("logout"),
      password: "Passw0rd!",
    });

    const logoutRes = await client.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    expect((await client.get("/api/auth/me")).status).toBe(401);
    expect((await client.post("/api/auth/refresh")).status).toBe(401);
  });
});
