"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validation/task";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  position: number;
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export function useTasks(projectId: string, search?: string) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);

  return useQuery({
    queryKey: ["tasks", projectId, search ?? ""],
    queryFn: () =>
      apiClient
        .get<{ items: Task[] }>(`/api/projects/${projectId}/tasks?${query.toString()}`)
        .then((r) => r.items),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiClient.post<{ task: Task }>(`/api/projects/${projectId}/tasks`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) =>
      apiClient.patch<{ task: Task }>(`/api/tasks/${taskId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.delete(`/api/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
