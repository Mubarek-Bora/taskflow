import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getOwnedProject } from "@/lib/projects";
import { createTaskSchema, taskStatusEnum } from "@/lib/validation/task";
import { ApiError, errorResponse } from "@/lib/api-error";

type RouteParams = { params: Promise<{ id: string }> };

const SORT_FIELDS = ["position", "dueDate", "createdAt", "title"] as const;

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;
    await getOwnedProject(projectId, user.sub);

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam ? taskStatusEnum.safeParse(statusParam) : null;
    const search = searchParams.get("search")?.trim();
    const sortParam = searchParams.get("sort");
    const sortField = SORT_FIELDS.includes(sortParam as (typeof SORT_FIELDS)[number])
      ? (sortParam as (typeof SORT_FIELDS)[number])
      : "position";
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(status?.success ? { status: status.data } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
      },
      orderBy: [{ [sortField]: order }, { createdAt: "asc" }],
    });

    return Response.json({ items: tasks });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id: projectId } = await params;
    await getOwnedProject(projectId, user.sub);

    const body = await request.json().catch(() => null);
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid input", parsed.error.flatten().fieldErrors);
    }

    const status = parsed.data.status ?? "TODO";
    const last = await prisma.task.findFirst({
      where: { projectId, status, deletedAt: null },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        status,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        position: (last?.position ?? -1) + 1,
        projectId,
        createdById: user.sub,
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
