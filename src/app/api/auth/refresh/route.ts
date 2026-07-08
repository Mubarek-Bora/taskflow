import { prisma } from "@/lib/prisma";
import {
  getRefreshTokenFromCookies,
  hashRefreshToken,
  generateRefreshToken,
  signAccessToken,
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function POST() {
  try {
    const rawToken = await getRefreshTokenFromCookies();
    if (!rawToken) throw new ApiError(401, "Not authenticated");

    const tokenHash = hashRefreshToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.user.deletedAt) {
      await clearAuthCookies();
      throw new ApiError(401, "Session expired, please log in again");
    }

    // Rotate: revoke the used refresh token and issue a fresh pair.
    const { token: newRefreshToken, tokenHash: newTokenHash } = generateRefreshToken();
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: stored.userId,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        },
      }),
    ]);

    const accessToken = await signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    });
    await setAuthCookies(accessToken, newRefreshToken);

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
