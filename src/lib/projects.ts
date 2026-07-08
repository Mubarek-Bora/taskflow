import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function getOwnedProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({ where: { id, ownerId: userId, deletedAt: null } });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}
