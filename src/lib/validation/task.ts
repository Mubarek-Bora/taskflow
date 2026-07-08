import { z } from "zod";

export const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type TaskStatus = z.infer<typeof taskStatusEnum>;

const dueDateSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), "Invalid date");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().max(4000, "Description is too long").optional().or(z.literal("")),
  status: taskStatusEnum.optional(),
  dueDate: dueDateSchema,
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  status: taskStatusEnum.optional(),
  dueDate: dueDateSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
