import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ink disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:border-ink disabled:opacity-50", className)}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export { Input, Textarea, NativeSelect };
