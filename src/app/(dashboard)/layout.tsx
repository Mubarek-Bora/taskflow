import { ReactNode } from "react";
import { DashboardNav } from "@/components/layout/DashboardNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
