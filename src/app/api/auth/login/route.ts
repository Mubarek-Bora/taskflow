import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword, issueSession } from "@/lib/auth";
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
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      logger.warn("Failed login attempt", { email });
      throw new ApiError(401, "Invalid email or password");
    }

    await issueSession(user);

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
