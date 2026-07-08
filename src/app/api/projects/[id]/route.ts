import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updateProjectSchema } from "@/lib/validation/project";
import { ApiError, errorResponse } from "@/lib/api-error";

type RouteParams = { params: Promise<{ id: string }> };

async function getOwnedProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id, ownerId: userId, deletedAt: null } });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const project = await getOwnedProject(id, user.sub);
    return Response.json({ project });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await getOwnedProject(id, user.sub);

    const body = await request.json().catch(() => null);
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid input", parsed.error.flatten().fieldErrors);
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description || null }
          : {}),
      },
    });

    return Response.json({ project });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await getOwnedProject(id, user.sub);

    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
