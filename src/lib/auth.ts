import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { ApiError } from "./api-error";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const ACCESS_COOKIE = "taskflow_access";
export const REFRESH_COOKIE = "taskflow_refresh";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function accessSecret() {
  return new TextEncoder().encode(requireEnv("JWT_ACCESS_SECRET"));
}

export type UserRole = "USER" | "ADMIN";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      sub: payload.sub,
      email: payload.email as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

/**
 * Refresh tokens are opaque random strings, not JWTs: the raw token is only
 * ever handed to the client, while a salted hash is stored in the database.
 * This makes them revocable (delete the row) without needing a signature check.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).update(requireEnv("JWT_REFRESH_SECRET")).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });

  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { path: "/api/auth", maxAge: 0 });
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

/** Reads and verifies the access token cookie, throwing a 401 ApiError if absent/invalid. */
export async function requireAuth(): Promise<AccessTokenPayload> {
  const token = await getAccessTokenFromCookies();
  if (!token) throw new ApiError(401, "Not authenticated");
  const payload = await verifyAccessToken(token);
  if (!payload) throw new ApiError(401, "Invalid or expired session");
  return payload;
}

export function requireRole(payload: AccessTokenPayload, role: UserRole) {
  if (payload.role !== role) throw new ApiError(403, "Forbidden");
}
