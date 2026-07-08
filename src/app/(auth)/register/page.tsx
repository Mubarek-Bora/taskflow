"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label, FieldError } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { ApiClientError } from "@/lib/api-client";

export default function RegisterPage() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), mode: "onBlur" });

  const onSubmit = (data: RegisterInput) => {
    registerUser.mutate(data, {
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Something went wrong");
      },
    });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">Start organizing your projects with TaskFlow</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
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
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <FieldError>{errors.password?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">
              At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
            </p>
          </div>
          <Button type="submit" className="w-full" isLoading={registerUser.isPending}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
