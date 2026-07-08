"use client";

import { useCurrentUser } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome back{user ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-2 text-muted-foreground">Your projects will show up here.</p>
    </div>
  );
}
