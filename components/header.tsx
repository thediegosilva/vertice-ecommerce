"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X, LayoutDashboard, LogOut, Package } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Dialog, SheetContent, DialogTitle } from "@/components/ui/dialog";
import { useCart, useWishlist } from "./providers";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme";
import { searchProductsAction } from "@/actions/store";
import { logoutAction } from "@/actions/auth";
import { cn, formatBRL } from "@/lib/utils";

const NAV = [
  { href: "/shop?sort=newest", label: "Novidades" },
  { href: "/shop?category=calcados", label: "Calçados" },
  { href: "/shop?category=vestuario", label: "Vestuário" },
  { href: "/shop?category=tech", label: "Tech" },
  { href: "/shop?category=acessorios", label: "Acessórios" },
  { href: "/shop?category=beleza", label: "Beleza" },
  { href: "/lookbook", label: "Lookbook" },
];

type HeaderUser = { name: string | null; email: string | null; role: "USER" | "ADMIN" } | null;
type SearchResult = Awaited<ReturnType<typeof searchProductsAction>>;

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setResults(await searchProductsAction(q));
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="absolute inset-x-0 top-full z-40 border-b bg-paper shadow-xl"
    >
      <div className="container py-6">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
            onClose();
          }}
          className="flex items-center gap-3 border-b-2 border-ink pb-3"
        >
          <Search className="size-5" aria-hidden />
          <label htmlFor="header-search" className="sr-only">Buscar produtos</label>
          <input
            id="header-search"
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={80}
            placeholder="O que você procura?"
            className="flex-1 bg-transparent font-display text-2xl font-bold outline-none placeholder:text-ink/30"
            onKeyDown={(e) => e.key === "Escape" && onClose()}
          />
          <button type="button" onClick={onClose} aria-label="Fechar busca" className="rounded-full p-2 hover:bg-stone2">
            <X className="size-5" />
          </button>
        </form>
        <div className="mt-4 min-h-12" aria-live="polite">
          {loading && <p className="text-sm text-muted-foreground">Buscando…</p>}
          {!loading && q.trim().length >= 2 && results.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto encontrado para “{q}”.</p>}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <li key={r.id}>
                <Link href={`/produto/${r.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-md p-2 transition hover:bg-stone2/60">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded bg-stone2">
                    {r.image && <Image src={r.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.category}</p>
                    <p className="text-sm font-bold">{formatBRL(r.priceCents)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

export function Header({ user }: { user: HeaderUser }) {
  const { cart, setOpen } = useCart();
  const { ids } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const activeHref = (() => {
    if (pathname === "/lookbook") return "/lookbook";
    if (pathname !== "/shop") return null;
    const cat = params.get("category");
    if (cat) return `/shop?category=${cat}`;
    return params.get("sort") === "newest" ? "/shop?sort=newest" : null;
  })();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setSearchOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const count = cart?.count ?? 0;

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-colors duration-300", scrolled ? "border-stone2 bg-paper/90 backdrop-blur-md" : "border-transparent bg-paper")}>
      <div className="container flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="-ml-2 rounded-md p-2 hover:bg-stone2">
            <Menu className="size-5" />
          </button>
        </div>
        <Logo />
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[13px] font-semibold uppercase tracking-wider">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={activeHref === n.href ? "page" : undefined} className={cn("relative py-2 transition-colors hover:text-flame", activeHref === n.href && "text-flame")}>
                  {n.label}
                  {activeHref === n.href && (
                    <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-flame" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar" aria-expanded={searchOpen} className="rounded-md p-2.5 hover:bg-stone2">
            <Search className="size-5" />
          </button>
          <Link href={user ? "/conta/favoritos" : "/favoritos"} aria-label={`Favoritos (${ids.size})`} className="relative hidden rounded-md p-2.5 hover:bg-stone2 sm:block">
            <Heart className="size-5" />
            {ids.size > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-flame" aria-hidden />}
          </Link>
          <ThemeToggle />
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger aria-label="Minha conta" className="rounded-md p-2.5 outline-none hover:bg-stone2">
                <User className="size-5" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-56 rounded-md border bg-card p-1.5 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{user.name ?? "Minha conta"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-stone2" />
                  {[
                    ["/conta", "Minha conta", User],
                    ["/conta/pedidos", "Meus pedidos", Package],
                    ["/conta/favoritos", "Favoritos", Heart],
                    ...(user.role === "ADMIN" ? [["/admin", "Painel admin", LayoutDashboard]] : []),
                  ].map(([href, label, Icon]) => {
                    const I = Icon as typeof User;
                    return (
                      <DropdownMenu.Item key={href as string} asChild>
                        <Link href={href as string} className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-stone2">
                          <I className="size-4" /> {label as string}
                        </Link>
                      </DropdownMenu.Item>
                    );
                  })}
                  <DropdownMenu.Separator className="my-1 h-px bg-stone2" />
                  <DropdownMenu.Item asChild>
                    <form action={logoutAction}>
                      <button type="submit" className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm outline-none hover:bg-stone2">
                        <LogOut className="size-4" /> Sair
                      </button>
                    </form>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <Link href="/login" aria-label="Entrar" className="rounded-md p-2.5 hover:bg-stone2">
              <User className="size-5" />
            </Link>
          )}
          <button onClick={() => setOpen(true)} aria-label={`Abrir carrinho (${count} itens)`} className="relative rounded-md p-2.5 hover:bg-stone2" data-testid="cart-button" data-cart-target>
            <ShoppingBag className="size-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="absolute right-0.5 top-0.5 flex size-[18px] items-center justify-center rounded-full bg-flame text-[10px] font-bold text-white"
                  data-testid="cart-count"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
      <AnimatePresence>{searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}</AnimatePresence>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <div className="p-6">
            <Logo />
          </div>
          <nav aria-label="Menu mobile" className="flex-1 overflow-y-auto px-6">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block border-b border-stone2 py-4 font-display text-2xl font-extrabold uppercase">{n.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t p-6 text-sm">
            <Link href={user ? "/conta" : "/login"} className="block font-semibold">{user ? "Minha conta" : "Entrar / Criar conta"}</Link>
            <Link href={user ? "/conta/favoritos" : "/favoritos"} className="block">Favoritos</Link>
            {user?.role === "ADMIN" && <Link href="/admin" className="block">Painel admin</Link>}
          </div>
        </SheetContent>
      </Dialog>
    </header>
  );
}
