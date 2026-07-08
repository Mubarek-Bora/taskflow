"use client";

import Link from "next/link";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function DashboardNav() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-foreground">
          TaskFlow
        </Link>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            isLoading={logout.isPending}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
