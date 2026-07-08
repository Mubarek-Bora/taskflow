import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import {
  verifyPassword,
  signAccessToken,
  generateRefreshToken,
  setAuthCookies,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`login:${clientIp(request)}`, 10, 60_000)) {
      throw new ApiError(429, "Too many attempts. Try again in a minute.");
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid input", parsed.error.flatten().fieldErrors);
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      logger.warn("Failed login attempt", { email });
      throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const { token: refreshToken, tokenHash } = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });
    await setAuthCookies(accessToken, refreshToken);

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
