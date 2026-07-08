"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validation/project";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number };
}

interface ProjectsResponse {
  items: Project[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export function useProjects(params: { search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));

  return useQuery({
    queryKey: ["projects", params.search ?? "", params.page ?? 1],
    queryFn: () => apiClient.get<ProjectsResponse>(`/api/projects?${query.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => apiClient.get<{ project: Project }>(`/api/projects/${id}`).then((r) => r.project),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiClient.post<{ project: Project }>("/api/projects", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) =>
      apiClient.patch<{ project: Project }>(`/api/projects/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
