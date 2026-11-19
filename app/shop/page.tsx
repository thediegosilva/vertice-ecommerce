import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ShopControls } from "@/components/shop/shop-controls";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/products";
import { shopQuerySchema } from "@/lib/validators";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = shopQuerySchema.parse(await searchParams);
  const cats = await getCategories();
  const cat = cats.find((c) => c.slug === q.category);
  return {
    title: cat ? cat.name : q.q ? `Busca: ${q.q}` : "Coleção",
    description: cat?.description ?? "Explore a coleção completa VÉRTICE: calçados, vestuário, tech, acessórios e beleza.",
    alternates: { canonical: cat ? `/shop?category=${cat.slug}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const query = shopQuerySchema.parse(flat);
  const [products, categories] = await Promise.all([getProducts(query), getCategories()]);
  const active = categories.find((c) => c.slug === query.category);

  return (
    <div className="container py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">Início</Link> / <span className="text-ink">{active?.name ?? "Coleção"}</span>
      </nav>
      <h1 className="mb-2 font-display text-4xl font-black uppercase md:text-6xl">{active?.name ?? "Coleção"}</h1>
      <p className="mb-8 max-w-xl text-muted-foreground">{active?.description ?? "Tudo o que você precisa para viver a cidade com estilo."}</p>
      <ShopControls categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }))} total={products.length}>
        {products.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed py-20 text-center">
            <SearchX className="size-10 text-muted-foreground" aria-hidden />
            <p className="mt-4 font-display text-xl font-bold">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente outros termos ou remova alguns filtros.</p>
            <Button asChild variant="outline" className="mt-6"><Link href="/shop">Limpar busca</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} priority={i < 3} />
            ))}
          </div>
        )}
      </ShopControls>
    </div>
  );
}
