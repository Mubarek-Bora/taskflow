import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[var(--radius-default)] border bg-background px-3 text-sm text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          error ? "border-danger" : "border-input",
          className
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
