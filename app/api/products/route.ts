import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { shopQuerySchema } from "@/lib/validators";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = shopQuerySchema.parse(params);
  const products = await getProducts(query);
  return NextResponse.json(
    products.map((p) => ({
      id: p.id, slug: p.slug, name: p.name, priceCents: p.priceCents, compareAtCents: p.compareAtCents,
      rating: p.rating, reviewCount: p.reviewCount, badge: p.badge, category: p.category, image: p.images[0]?.url ?? null,
    })),
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        // CDN do Netlify: o cache precisa variar pelos filtros da query string
        "Netlify-Vary": "query",
      },
    },
  );
}
