import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { pageUser } from "@/lib/auth-guard";
import { productCardSelect } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default async function WishlistPage() {
  const user = await pageUser();
  const rows = await db.wishlist.findMany({
    where: { userId: user.id, product: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    include: { product: { select: productCardSelect } },
  });
  return (
    <section>
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase">Favoritos</h2>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
          <Heart className="size-10 text-muted-foreground" />
          <p className="mt-4 font-display text-xl font-bold">Nenhum favorito ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Toque no coração dos produtos para salvá-los aqui.</p>
          <Button asChild className="mt-6"><Link href="/shop">Explorar coleção</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {rows.map((r, i) => <ProductCard key={r.id} product={r.product} index={i} />)}
        </div>
      )}
    </section>
  );
}
