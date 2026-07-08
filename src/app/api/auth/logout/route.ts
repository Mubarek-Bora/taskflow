import { prisma } from "@/lib/prisma";
import { getRefreshTokenFromCookies, hashRefreshToken, clearAuthCookies } from "@/lib/auth";
import { errorResponse } from "@/lib/api-error";

export async function POST() {
  try {
    const rawToken = await getRefreshTokenFromCookies();
    if (rawToken) {
      const tokenHash = hashRefreshToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await clearAuthCookies();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
