import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword, issueSession } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`register:${clientIp(request)}`, 5, 60_000)) {
      throw new ApiError(429, "Too many attempts. Try again in a minute.");
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid input", parsed.error.flatten().fieldErrors);
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });

    await issueSession(user);

    logger.info("User registered", { userId: user.id });

    return Response.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
