"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; count: number };

const PendingCtx = createContext(false);
export const useShopPending = () => useContext(PendingCtx);

const PRICE_RANGES = [
  { label: "Até R$ 300", min: undefined, max: 300 },
  { label: "R$ 300 – R$ 700", min: 300, max: 700 },
  { label: "R$ 700 – R$ 1.500", min: 700, max: 1500 },
  { label: "Acima de R$ 1.500", min: 1500, max: undefined },
];

function useParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  return { params, update, pending };
}

function Filters({ categories, update, params, pillId }: { categories: Category[]; update: (p: Record<string, string | undefined>) => void; params: URLSearchParams; pillId: string }) {
  const cat = params.get("category") ?? "";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const rating = params.get("rating") ?? "";
  const hasFilters = !!(cat || min || max || rating || params.get("q"));

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em]">Categoria</legend>
        <ul className="isolate space-y-1">
          <li>
            <button onClick={() => update({ category: undefined })} className={cn("relative flex w-full justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-stone2", !cat && "font-semibold text-paper hover:bg-transparent")}>
              {!cat && <motion.span layoutId={`${pillId}-cat`} className="absolute inset-0 -z-10 rounded bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              Todas
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => update({ category: c.slug })}
                aria-pressed={cat === c.slug}
                className={cn("relative flex w-full justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-stone2", cat === c.slug && "font-semibold text-paper hover:bg-transparent")}
              >
                {cat === c.slug && <motion.span layoutId={`${pillId}-cat`} className="absolute inset-0 -z-10 rounded bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                {c.name} <span className="opacity-60">{c.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em]">Preço</legend>
        <ul className="space-y-1">
          {PRICE_RANGES.map((r) => {
            const active = min === String(r.min ?? "") && max === String(r.max ?? "");
            return (
              <li key={r.label}>
                <button
                  onClick={() => (active ? update({ min: undefined, max: undefined }) : update({ min: r.min?.toString(), max: r.max?.toString() }))}
                  aria-pressed={active}
                  className={cn("w-full rounded px-2 py-1.5 text-left text-sm hover:bg-stone2", active && "bg-ink font-semibold text-paper hover:bg-ink")}
                >
                  {r.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" inputMode="numeric" min={0} placeholder="Mín" aria-label="Preço mínimo" defaultValue={min} key={`min-${min}`} onBlur={(e) => update({ min: e.target.value || undefined })} className="h-9 w-full rounded border bg-card px-2 text-sm" />
          <span aria-hidden>–</span>
          <input type="number" inputMode="numeric" min={0} placeholder="Máx" aria-label="Preço máximo" defaultValue={max} key={`max-${max}`} onBlur={(e) => update({ max: e.target.value || undefined })} className="h-9 w-full rounded border bg-card px-2 text-sm" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-xs font-bold uppercase tracking-[0.2em]">Avaliação</legend>
        <div className="flex flex-wrap gap-2">
          {["4.5", "4.8", "5"].map((r) => (
            <button key={r} onClick={() => update({ rating: rating === r ? undefined : r })} aria-pressed={rating === r} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", rating === r ? "border-ink bg-ink text-paper" : "hover:border-ink")}>
              ★ {r}{r !== "5" && "+"}
            </button>
          ))}
        </div>
      </fieldset>
      {hasFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ category: undefined, min: undefined, max: undefined, rating: undefined, q: undefined })}>
          <X /> Limpar filtros
        </Button>
      )}
    </div>
  );
}

export function ShopControls({ categories, total, children }: { categories: Category[]; total: number; children: React.ReactNode }) {
  const { params, update, pending } = useParamUpdater();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Busca ao vivo com debounce
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q.trim() === current) return;
    const t = setTimeout(() => update({ q: q.trim() || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <PendingCtx.Provider value={pending}>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="shop-search" className="sr-only">Buscar na loja</label>
          <input
            id="shop-search"
            type="search"
            value={q}
            maxLength={80}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos, categorias…"
            className="h-12 w-full rounded-md border bg-card pl-10 pr-3 text-sm focus-visible:border-ink"
            data-testid="shop-search"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <SlidersHorizontal /> Filtros
          </Button>
          <label htmlFor="sort" className="sr-only">Ordenar por</label>
          <NativeSelect id="sort" value={params.get("sort") ?? "relevance"} onChange={(e) => update({ sort: e.target.value === "relevance" ? undefined : e.target.value })} className="h-12 md:w-56" data-testid="shop-sort">
            <option value="relevance">Relevância</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="rating">Melhor avaliados</option>
            <option value="newest">Novidades</option>
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <Filters categories={categories} update={update} params={params} pillId="desk" />
        </aside>
        <div>
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {pending ? "Atualizando…" : `${total} ${total === 1 ? "produto" : "produtos"}`}
          </p>
          <div className={cn("transition-opacity duration-200", pending && "opacity-50")}>{children}</div>
        </div>
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" aria-describedby={undefined} className="overflow-y-auto p-6">
          <DialogTitle className="mb-6 font-display text-xl font-extrabold uppercase">Filtros</DialogTitle>
          <Filters categories={categories} update={update} params={params} pillId="mob" />
          <Button className="mt-8 w-full" onClick={() => setMobileOpen(false)}>Ver {total} produtos</Button>
        </SheetContent>
      </Dialog>
    </PendingCtx.Provider>
  );
}
