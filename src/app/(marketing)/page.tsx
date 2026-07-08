import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 text-center">
      <span className="mb-4 text-sm font-medium text-primary">TaskFlow</span>
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Organize projects. Ship tasks. Stay on top of deadlines.
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        A clean, fast task and project tracker with real-time boards and a dashboard built for
        focus.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/register">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">
            Log in
          </Button>
        </Link>
      </div>
    </div>
  );
}
