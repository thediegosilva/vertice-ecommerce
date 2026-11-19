"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "./providers";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { cn, formatBRL, installments } from "@/lib/utils";

export function FreeShippingBar({ subtotalCents, missing }: { subtotalCents: number; missing: number }) {
  const pct = Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100));
  return (
    <div className="rounded-md bg-stone2/60 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-medium">
        <Truck className="size-4 text-flame" aria-hidden />
        {missing > 0 ? (
          <span>
            Falta <b>{formatBRL(missing)}</b> para <b>frete grátis</b>
          </span>
        ) : (
          <span className="font-bold text-emerald-700 dark:text-emerald-400">Parabéns! Você ganhou frete grátis 🎉</span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-card" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso para frete grátis">
        <motion.div className={cn("h-full rounded-full", missing > 0 ? "bg-flame" : "bg-emerald-600")} initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", damping: 20 }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { cart, open, setOpen, update, pending } = useCart();
  const items = cart?.items ?? [];
  const inst = installments(cart?.subtotalCents ?? 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SheetContent aria-describedby={undefined} data-testid="cart-drawer">
        <div className="border-b px-6 py-5">
          <DialogTitle className="font-display text-xl font-extrabold uppercase tracking-tight">
            Carrinho <span className="text-muted-foreground">({cart?.count ?? 0})</span>
          </DialogTitle>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-stone2">
              <ShoppingBag className="size-8" aria-hidden />
            </div>
            <p className="font-display text-xl font-bold">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground">Explore a coleção e encontre algo que é a sua cara.</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/shop">Ver coleção</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="px-6 pt-4">
              <FreeShippingBar subtotalCents={cart!.subtotalCents} missing={cart!.missingForFreeShipping} />
            </div>
            <ul className={cn("flex-1 divide-y overflow-y-auto px-6 transition-opacity", pending && "opacity-60")}>
              <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="flex gap-4 overflow-hidden py-5"
                  data-testid="cart-item"
                >
                  <Link href={`/produto/${item.slug}`} onClick={() => setOpen(false)} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded bg-stone2">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link href={`/produto/${item.slug}`} onClick={() => setOpen(false)} className="text-sm font-semibold leading-tight hover:underline">
                        {item.name}
                      </Link>
                      <button onClick={() => update(item.id, 0)} aria-label={`Remover ${item.name}`} className="text-muted-foreground transition hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{[item.size && `Tam. ${item.size}`, item.color].filter(Boolean).join(" · ")}</p>
                    {!item.available && <p className="mt-1 text-xs font-semibold text-destructive">Estoque insuficiente ({item.stock} disponível)</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-md border">
                        <button onClick={() => update(item.id, item.quantity - 1)} aria-label="Diminuir quantidade" className="p-2 hover:bg-stone2">
                          <Minus className="size-3" />
                        </button>
                        <span className="relative w-8 overflow-hidden text-center text-sm font-semibold" aria-live="polite">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span key={item.quantity} className="inline-block" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
                              {item.quantity}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                        <button onClick={() => update(item.id, item.quantity + 1)} disabled={item.quantity >= Math.min(10, item.stock)} aria-label="Aumentar quantidade" className="p-2 hover:bg-stone2 disabled:opacity-30">
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <AnimatedNumber className="text-sm font-bold" value={item.unitPriceCents * item.quantity} money />
                    </div>
                  </div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>
            <div className="space-y-3 border-t bg-card px-6 py-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <AnimatedNumber className="font-bold" data-testid="cart-subtotal" value={cart!.subtotalCents} money />
              </div>
              <p className="text-right text-xs text-muted-foreground">ou {inst.count}x de {inst.value} sem juros</p>
              <p className="text-xs text-muted-foreground">Frete e cupons calculados no checkout.</p>
              <Button asChild variant="accent" size="lg" className="glow-border relative w-full" onClick={() => setOpen(false)}>
                <Link href="/checkout">Finalizar compra</Link>
              </Button>
              <button onClick={() => setOpen(false)} className="w-full text-center text-sm font-semibold underline-offset-4 hover:underline">
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
