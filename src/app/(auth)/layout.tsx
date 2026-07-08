import { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      {children}
    </div>
  );
}
