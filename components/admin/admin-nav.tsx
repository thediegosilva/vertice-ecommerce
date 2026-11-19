"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LayoutDashboard, Package, ShoppingCart, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/produtos", "Produtos", Package],
  ["/admin/pedidos", "Pedidos", ShoppingCart],
  ["/admin/cupons", "Cupons", Tag],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 hidden text-xs font-bold uppercase tracking-[0.25em] text-flame lg:block">Painel admin</p>
      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map(([href, label, Icon]) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("relative isolate flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors", active ? "text-paper" : "hover:bg-stone2")}>
              {active && <motion.span layoutId="admin-pill" className="absolute inset-0 -z-10 rounded-md bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Icon className="size-4" /> {label}
            </Link>
          );
        })}
        <Link href="/" className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-stone2">
          <ArrowLeft className="size-4" /> Voltar à loja
        </Link>
      </div>
    </nav>
  );
}
