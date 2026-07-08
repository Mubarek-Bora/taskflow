import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateTaskSchema } from "@/lib/validation/task";
import { ApiError, errorResponse } from "@/lib/api-error";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedTask(id: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id, deletedAt: null, project: { ownerId: userId, deletedAt: null } },
  });
  if (!task) throw new ApiError(404, "Task not found");
  return task;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const task = await getOwnedTask(id, user.sub);
    return Response.json({ task });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const existing = await getOwnedTask(id, user.sub);

    const body = await request.json().catch(() => null);
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid input", parsed.error.flatten().fieldErrors);
    }

    const data: {
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      status?: "TODO" | "IN_PROGRESS" | "DONE";
      position?: number;
    } = {};

    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description || null;
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }

    // Moving to a different column: append to the end of the destination column.
    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
      const last = await prisma.task.findFirst({
        where: { projectId: existing.projectId, status: parsed.data.status, deletedAt: null },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      data.status = parsed.data.status;
      data.position = (last?.position ?? -1) + 1;
    }

    const task = await prisma.task.update({ where: { id }, data });
    return Response.json({ task });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await getOwnedTask(id, user.sub);

    await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
