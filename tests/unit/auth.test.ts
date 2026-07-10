import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "unit-test-access-secret";
  process.env.JWT_REFRESH_SECRET = "unit-test-refresh-secret";
});

describe("password hashing", () => {
  it("hashes a password and verifies it round-trips", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("Passw0rd!");
    expect(hash).not.toBe("Passw0rd!");
    expect(await verifyPassword("Passw0rd!", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("Passw0rd!");
    expect(await verifyPassword("WrongPassword1", hash)).toBe(false);
  });
});

describe("access tokens", () => {
  it("signs and verifies a token round-trip", async () => {
    const { signAccessToken, verifyAccessToken } = await import("@/lib/auth");
    const token = await signAccessToken({ sub: "user_1", email: "a@b.com", role: "USER" });
    const payload = await verifyAccessToken(token);
    expect(payload).toEqual({ sub: "user_1", email: "a@b.com", role: "USER" });
  });

  it("rejects a tampered token", async () => {
    const { signAccessToken, verifyAccessToken } = await import("@/lib/auth");
    const token = await signAccessToken({ sub: "user_1", email: "a@b.com", role: "USER" });
    const tampered = token.slice(0, -2) + (token.at(-2) === "a" ? "b" : "a") + token.at(-1);
    expect(await verifyAccessToken(tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { signAccessToken, verifyAccessToken } = await import("@/lib/auth");
    const token = await signAccessToken({ sub: "user_1", email: "a@b.com", role: "USER" });

    process.env.JWT_ACCESS_SECRET = "a-completely-different-secret";
    const result = await verifyAccessToken(token);
    process.env.JWT_ACCESS_SECRET = "unit-test-access-secret";

    expect(result).toBeNull();
  });

  it("rejects garbage input", async () => {
    const { verifyAccessToken } = await import("@/lib/auth");
    expect(await verifyAccessToken("not.a.jwt")).toBeNull();
  });
});

describe("refresh tokens", () => {
  it("generates a unique opaque token each time", async () => {
    const { generateRefreshToken } = await import("@/lib/auth");
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("hashes the same raw token to the same hash", async () => {
    const { generateRefreshToken, hashRefreshToken } = await import("@/lib/auth");
    const { token, tokenHash } = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(tokenHash);
  });

  it("produces a different hash for a different token", async () => {
    const { hashRefreshToken } = await import("@/lib/auth");
    expect(hashRefreshToken("token-a")).not.toBe(hashRefreshToken("token-b"));
  });
});

describe("requireRole", () => {
  it("passes when the role matches", async () => {
    const { requireRole } = await import("@/lib/auth");
    expect(() =>
      requireRole({ sub: "1", email: "a@b.com", role: "ADMIN" }, "ADMIN")
    ).not.toThrow();
  });

  it("throws a 403 ApiError when the role does not match", async () => {
    const { requireRole } = await import("@/lib/auth");
    const { ApiError } = await import("@/lib/api-error");
    try {
      requireRole({ sub: "1", email: "a@b.com", role: "USER" }, "ADMIN");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as InstanceType<typeof ApiError>).status).toBe(403);
    }
  });
});
