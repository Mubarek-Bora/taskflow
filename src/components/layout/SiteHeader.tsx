import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="bg-gradient-to-r from-gradient-from via-gradient-via to-gradient-to bg-clip-text text-lg font-bold text-transparent"
        >
          TaskFlow
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
