"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Shield, User } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/conta", "Perfil", User],
  ["/conta/pedidos", "Pedidos", Package],
  ["/conta/enderecos", "Endereços", MapPin],
  ["/conta/favoritos", "Favoritos", Heart],
  ["/conta/seguranca", "Segurança", Shield],
] as const;

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Conta" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {LINKS.map(([href, label, Icon]) => {
        const active = href === "/conta" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("relative isolate flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors", active ? "text-paper" : "hover:bg-stone2")}>
            {active && <motion.span layoutId="account-pill" className="absolute inset-0 -z-10 rounded-md bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-flame hover:bg-stone2">
          <LayoutDashboard className="size-4" /> Painel admin
        </Link>
      )}
      <form action={logoutAction}>
        <button className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-stone2">
          <LogOut className="size-4" /> Sair
        </button>
      </form>
    </nav>
  );
}
