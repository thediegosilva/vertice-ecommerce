import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider", {
  variants: {
    variant: {
      default: "bg-ink text-paper",
      accent: "bg-flame text-white",
      outline: "border border-ink/20 text-ink",
      muted: "bg-stone2 text-ink",
      success: "bg-emerald-600 text-white",
      warning: "bg-amber-500 text-ink",
      danger: "bg-destructive text-white",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
