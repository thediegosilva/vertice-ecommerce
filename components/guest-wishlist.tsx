"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getProductsByIdsAction } from "@/actions/store";
import { ProductCard, ProductGridSkeleton, type CardProduct } from "./product-card";
import { useWishlist } from "./providers";
import { Button } from "./ui/button";

export function GuestWishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<CardProduct[] | null>(null);
  const key = [...ids].sort().join(",");

  useEffect(() => {
    let alive = true;
    getProductsByIdsAction(key ? key.split(",") : []).then((p) => alive && setProducts(p));
    return () => {
      alive = false;
    };
  }, [key]);

  if (products === null) return <ProductGridSkeleton count={4} />;
  const visible = products.filter((p) => ids.has(p.id));
  if (visible.length === 0)
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
        <Heart className="size-10 text-muted-foreground" />
        <p className="mt-4 font-display text-xl font-bold">Nenhum favorito ainda</p>
        <Button asChild className="mt-6"><Link href="/shop">Explorar coleção</Link></Button>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
      {visible.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}
