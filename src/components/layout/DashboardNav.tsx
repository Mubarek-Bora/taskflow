"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DashboardNav() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-foreground">
          TaskFlow
        </Link>

        <div className="hidden items-center gap-4 sm:flex">
          <ThemeToggle />
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

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          className="rounded-[var(--radius-default)] p-2 text-foreground hover:bg-muted sm:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:hidden">
          <div className="flex items-center justify-between">
            {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            isLoading={logout.isPending}
          >
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
