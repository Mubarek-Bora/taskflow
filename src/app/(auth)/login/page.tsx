"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label, FieldError } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { ApiClientError } from "@/lib/api-client";

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), mode: "onBlur" });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="mb-6 text-sm text-muted-foreground">Log in to your TaskFlow account</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          <Button type="submit" className="w-full" isLoading={login.isPending}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
