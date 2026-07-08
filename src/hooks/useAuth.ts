"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

const ME_QUERY_KEY = ["me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => apiClient.get<{ user: CurrentUser }>("/api/auth/me").then((r) => r.user),
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiClient.post<{ user: CurrentUser }>("/api/auth/login", input),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      router.push("/dashboard");
      router.refresh();
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiClient.post<{ user: CurrentUser }>("/api/auth/register", input),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_QUERY_KEY, data.user);
      router.push("/dashboard");
      router.refresh();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => apiClient.post("/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });
}
