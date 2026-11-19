import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" aria-label="VÉRTICE — página inicial" className={cn("font-display text-xl font-black tracking-[0.1em] sm:text-2xl sm:tracking-[0.12em]", light ? "text-white" : "text-ink", className)}>
      VÉRTICE<span className="text-flame">.</span>
    </Link>
  );
}
