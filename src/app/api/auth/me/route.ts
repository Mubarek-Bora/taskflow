import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new ApiError(401, "User not found");
    return Response.json({ user });
  } catch (err) {
    return errorResponse(err);
  }
}
