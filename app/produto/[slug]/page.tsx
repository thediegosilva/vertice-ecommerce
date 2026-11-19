import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { auth } from "@/auth";
import { Gallery } from "@/components/product/gallery";
import { ReviewForm } from "@/components/product/review-form";
import { PriceBlock, ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { Rating } from "@/components/rating";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getRelated } from "@/lib/products";
import { absoluteUrl } from "@/lib/utils";
import { slugSchema } from "@/lib/validators";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return null;
  return getProductBySlug(parsed.data);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await load((await params).slug);
  if (!product) notFound();
  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: `${product.name} | VÉRTICE`,
      description,
      url: absoluteUrl(`/produto/${product.slug}`),
      images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await load((await params).slug);
  if (!product) notFound();
  const [related, session] = await Promise.all([getRelated(product.id, product.categoryId), auth()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.id,
    brand: { "@type": "Brand", name: "VÉRTICE" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/produto/${product.slug}`),
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <script
        type="application/ld+json"
        // JSON-LD gerado no servidor; "<" escapado impede quebra do <script> (padrão recomendado pelo Next.js)
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">Início</Link> / <Link href={`/shop?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link> / <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <Gallery images={product.images} name={product.name} />
        </div>
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className="flex gap-2">
            {product.badge && <Badge>{product.badge}</Badge>}
            <Badge variant="outline">{product.category.name}</Badge>
          </div>
          <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight md:text-5xl">{product.name}</h1>
          <a href="#avaliacoes" className="mt-3 inline-block">
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </a>
          <div className="mt-6">
            <PriceBlock priceCents={product.priceCents} compareAtCents={product.compareAtCents} large />
          </div>
          <p className="mt-6 leading-relaxed text-ink/80">{product.description}</p>
          <div className="mt-8">
            <ProductPurchase product={product} />
          </div>
          {product.details.length > 0 && (
            <details className="group mt-6 border-t pt-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold uppercase tracking-wider">
                Detalhes do produto <span className="transition group-open:rotate-45">+</span>
              </summary>
              <ul className="mt-4 space-y-2 text-sm">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-flame" aria-hidden /> {d}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <section id="avaliacoes" className="mt-20 grid gap-10 border-t pt-14 lg:grid-cols-[1fr_2fr]" aria-labelledby="reviews-title">
        <div>
          <h2 id="reviews-title" className="font-display text-3xl font-black uppercase">Avaliações</h2>
          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-6xl font-black">{product.rating.toFixed(1)}</span>
            <div className="pb-2">
              <Rating value={product.rating} size="md" />
              <p className="text-sm text-muted-foreground">{product.reviewCount} avaliações</p>
            </div>
          </div>
          <div className="mt-6">
            {session?.user ? (
              <ReviewForm productId={product.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href={`/login?callbackUrl=/produto/${product.slug}`} className="font-semibold text-ink underline">Entre</Link> para avaliar este produto.
              </p>
            )}
          </div>
        </div>
        <ul className="divide-y">
          {product.reviews.length === 0 && <li className="py-6 text-muted-foreground">Seja o primeiro a avaliar.</li>}
          {product.reviews.map((r) => (
            <li key={r.id} className="py-6 first:pt-0">
              <div className="flex items-center justify-between">
                <Rating value={r.rating} />
                <time className="text-xs text-muted-foreground" dateTime={r.createdAt.toISOString()}>{r.createdAt.toLocaleDateString("pt-BR")}</time>
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-ink/80">{r.comment}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{r.user.name?.split(" ")[0] ?? "Cliente"}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-8 font-display text-3xl font-black uppercase">Você também vai curtir</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
