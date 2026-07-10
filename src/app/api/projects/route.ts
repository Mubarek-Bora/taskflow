import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validation/project";
import { ApiError, errorResponse } from "@/lib/api-error";
import { parsePagination, paginationMeta } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const where = {
      ownerId: user.sub,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    // $transaction (not Promise.all) so both queries run on the same
    // connection/snapshot -- on a pooled serverless Postgres (Neon), two
    // independently-acquired connections via Promise.all can occasionally
    // disagree on very recently committed rows (count sees it, findMany
    // doesn't), since each grabs its own connection from the pool.
    const [items, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" as const },
        skip,
        take,
        include: { _count: { select: { tasks: { where: { deletedAt: null } } } } },
      }),
      prisma.project.count({ where }),
    ]);

    return Response.json({ items, pagination: paginationMeta(page, pageSize, total) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json().catch(() => null);
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid input", parsed.error.flatten().fieldErrors);
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        ownerId: user.sub,
      },
    });

    return Response.json({ project }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
