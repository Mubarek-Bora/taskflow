import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  description: z.string().trim().max(2000, "Description is too long").optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
