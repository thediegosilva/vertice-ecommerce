import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({ value, count, className, size = "sm" }: { value: number; count?: number; className?: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex" role="img" aria-label={`Avaliação ${value.toFixed(1)} de 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(s, i <= Math.round(value) ? "fill-flame text-flame" : "fill-stone2 text-stone2")} aria-hidden />
        ))}
      </div>
      <span className="text-xs font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
