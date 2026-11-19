"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Eye, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Rating } from "./rating";
import { PriceBlock, ProductPurchase } from "./product-purchase";
import { useWishlist } from "./providers";
import { cn, discountPercent } from "@/lib/utils";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  rating: number;
  reviewCount: number;
  badge: string | null;
  stock: number;
  sizes: string[];
  colors: string[];
  category: { name: string; slug: string };
  images: { url: string; alt: string }[];
};

export function ProductCard({ product, priority = false, index = 0 }: { product: CardProduct; priority?: boolean; index?: number }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const { has, toggle } = useWishlist();
  const saved = has(product.id);
  const off = discountPercent(product.priceCents, product.compareAtCents);
  const [main, alt] = product.images;

  return (
    <article
      className="group relative animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
      style={{ animationDelay: `${(index % 4) * 60}ms` }}
      data-testid="product-card"
    >
      <div data-tilt data-spotlight className="glow-border relative aspect-[4/5] rounded-md bg-stone2">
        <div className="absolute inset-0 overflow-hidden rounded-md">
        <Link href={`/produto/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {main && (
            <Image
              src={main.url}
              alt={main.alt}
              fill
              priority={priority}
              sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
              className={cn("object-cover transition duration-700 ease-out group-hover:scale-105", alt && "group-hover:opacity-0")}
            />
          )}
          {alt && <Image src={alt.url} alt="" fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw" className="object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100" />}
        </Link>
        </div>
        <div className="pointer-events-none absolute left-3 top-3 z-[3] flex flex-col gap-1.5">
          {product.badge && <Badge variant={product.badge === "Oferta" ? "accent" : "default"}>{product.badge}</Badge>}
          {off > 0 && <Badge variant="accent">-{off}%</Badge>}
          {product.stock === 0 && <Badge variant="muted">Esgotado</Badge>}
        </div>
        <button
          onClick={() => toggle(product.id)}
          aria-label={saved ? `Remover ${product.name} dos favoritos` : `Salvar ${product.name} nos favoritos`}
          aria-pressed={saved}
          className="absolute right-3 top-3 z-[3] flex size-9 items-center justify-center rounded-full bg-card/90 shadow-sm transition hover:scale-110 active:scale-90"
        >
          <Heart className={cn("size-4 transition-transform duration-300", saved && "scale-110 fill-flame text-flame")} />
        </button>
        <button
          onClick={() => setQuickOpen(true)}
          className="absolute inset-x-3 bottom-3 z-[3] flex translate-y-2 items-center justify-center gap-2 rounded-md bg-card/95 py-3 text-xs font-bold uppercase tracking-wider opacity-0 shadow transition duration-300 hover:bg-ink hover:text-paper focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Eye className="size-4" aria-hidden /> Compra rápida
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{product.category.name}</p>
        <h3 className="font-sans text-sm font-semibold leading-snug">
          <Link href={`/produto/${product.slug}`} className="hover:underline">{product.name}</Link>
        </h3>
        <Rating value={product.rating} count={product.reviewCount} />
        <PriceBlock priceCents={product.priceCents} compareAtCents={product.compareAtCents} />
      </div>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/5] bg-stone2 md:aspect-auto md:min-h-[520px]">
              {main && <Image src={main.url} alt={main.alt} fill sizes="(min-width:768px) 450px, 100vw" className="object-cover" />}
            </div>
            <div className="space-y-5 p-6 md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{product.category.name}</p>
                <DialogTitle className="mt-1 font-display text-2xl font-extrabold">{product.name}</DialogTitle>
                <Rating value={product.rating} count={product.reviewCount} className="mt-2" />
              </div>
              <PriceBlock priceCents={product.priceCents} compareAtCents={product.compareAtCents} large />
              <DialogDescription className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{product.description}</DialogDescription>
              <ProductPurchase product={product} compact onAdded={() => setQuickOpen(false)} />
              <Link href={`/produto/${product.slug}`} className="inline-block text-sm font-semibold underline underline-offset-4">
                Ver detalhes completos
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="skeleton-shine aspect-[4/5] rounded-md bg-stone2" />
          <div className="h-3 w-1/3 skeleton-shine rounded bg-stone2" />
          <div className="h-4 w-3/4 skeleton-shine rounded bg-stone2" />
          <div className="h-4 w-1/2 skeleton-shine rounded bg-stone2" />
        </div>
      ))}
    </div>
  );
}
