import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-[var(--radius-default)] border bg-background px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          error ? "border-danger" : "border-input",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
