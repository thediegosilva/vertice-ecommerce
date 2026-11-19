"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn("text-xs font-semibold uppercase tracking-wider text-ink/80", className)} {...props} />
));
Label.displayName = "Label";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="mt-1 text-xs text-destructive">{children}</p>;
}
