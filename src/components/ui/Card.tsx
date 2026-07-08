import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-default)] border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
