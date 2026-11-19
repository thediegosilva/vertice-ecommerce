"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useWishlist } from "./providers";
import { cn, formatBRL, installments, discountPercent } from "@/lib/utils";

export type PurchaseProduct = {
  id: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  images?: { url: string; alt: string }[];
};

export function PriceBlock({ priceCents, compareAtCents, large = false }: { priceCents: number; compareAtCents: number | null; large?: boolean }) {
  const off = discountPercent(priceCents, compareAtCents);
  const inst = installments(priceCents);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={cn("font-bold", large ? "text-3xl" : "text-base")}>{formatBRL(priceCents)}</span>
        {compareAtCents && off > 0 && (
          <>
            <span className={cn("text-muted-foreground line-through", large ? "text-base" : "text-xs")}>{formatBRL(compareAtCents)}</span>
            <span className={cn("font-bold text-flame", large ? "text-sm" : "text-xs")}>-{off}%</span>
          </>
        )}
      </div>
      <p className={cn("text-muted-foreground", large ? "mt-1 text-sm" : "text-xs")}>
        ou {inst.count}x de {inst.value} sem juros
      </p>
    </div>
  );
}

export function ProductPurchase({ product, compact = false, onAdded }: { product: PurchaseProduct; compact?: boolean; onAdded?: () => void }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const soldOut = product.stock <= 0;
  const saved = has(product.id);

  async function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    const from = e.currentTarget.getBoundingClientRect();
    if (product.sizes.length && !size) {
      setSizeError(true);
      return;
    }
    setBusy(true);
    const src = product.images?.[0]?.url;
    const ok = await add({ productId: product.id, quantity: qty, size, color }, src ? { src: `/_next/image?url=${encodeURIComponent(src)}&w=256&q=70`, from } : undefined);
    setBusy(false);
    if (ok) onAdded?.();
  }

  return (
    <div className="space-y-6">
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider">
            Cor: <span className="font-normal normal-case text-muted-foreground">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={cn("rounded-md border px-3 py-2 text-xs font-semibold transition", color === c ? "border-ink bg-ink text-paper" : "border-input hover:border-ink")}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {product.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider">Tamanho</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                className={cn("min-w-12 rounded-md border px-3 py-2.5 text-sm font-semibold transition", size === s ? "border-ink bg-ink text-paper" : "border-input bg-card hover:border-ink")}
              >
                {s}
              </button>
            ))}
          </div>
          {sizeError && <p role="alert" className="mt-2 text-xs font-semibold text-destructive">Selecione um tamanho</p>}
        </fieldset>
      )}

      <div>
        <p className={cn("mb-2 text-xs font-semibold", product.stock > 0 && product.stock <= 10 ? "text-flame" : "text-muted-foreground")}>
          {soldOut ? "Esgotado" : product.stock <= 10 ? `Últimas ${product.stock} unidades!` : "Em estoque"}
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center rounded-md border bg-card">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade" className="p-3 hover:bg-stone2">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center font-semibold" aria-live="polite" aria-label="Quantidade">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(Math.min(10, product.stock), q + 1))} aria-label="Aumentar quantidade" className="p-3 hover:bg-stone2">
              <Plus className="size-4" />
            </button>
          </div>
          <Button size="lg" variant="accent" className="relative order-last min-w-[12rem] flex-1 basis-full overflow-hidden sm:order-none sm:basis-0" data-magnetic="0.12" onClick={handleAdd} disabled={busy || soldOut} data-testid="add-to-cart">
            {soldOut ? "Esgotado" : busy ? "Adicionando…" : "Adicionar ao carrinho"}
          </Button>
          <Button size="lg" variant="outline" className="px-4" aria-label={saved ? "Remover dos favoritos" : "Salvar nos favoritos"} aria-pressed={saved} onClick={() => toggle(product.id)}>
            <Heart className={cn(saved && "fill-flame text-flame")} />
          </Button>
        </div>
      </div>

      {!compact && (
        <ul className="space-y-2 border-t pt-5 text-sm">
          <li className="flex items-center gap-2"><Truck className="size-4 text-flame" aria-hidden /> Frete grátis em compras acima de R$ 399</li>
          <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-flame" aria-hidden /> Troca grátis em até 30 dias · Compra 100% segura</li>
        </ul>
      )}
    </div>
  );
}
