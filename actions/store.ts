"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { getProducts, productCardSelect } from "@/lib/products";
import { newsletterSchema, reviewSchema, shopQuerySchema } from "@/lib/validators";

export async function subscribeNewsletterAction(input: unknown): Promise<ActionResult<null>> {
  return runAction("newsletter", async () => {
    await enforceRateLimit("sensitive", "newsletter");
    const { email } = newsletterSchema.parse(input);
    await db.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
    return null;
  });
}

export async function addReviewAction(input: unknown): Promise<ActionResult<null>> {
  return runAction("review", async () => {
    const user = await requireUser();
    await enforceRateLimit("write");
    const data = reviewSchema.parse(input);
    const product = await db.product.findFirst({ where: { id: data.productId, deletedAt: null }, select: { id: true, slug: true, rating: true, reviewCount: true } });
    if (!product) throw new UserError("Produto não encontrado.");
    const exists = await db.review.findUnique({ where: { productId_userId: { productId: data.productId, userId: user.id } } });
    if (exists) throw new UserError("Você já avaliou este produto.");
    await db.$transaction(async (tx) => {
      await tx.review.create({ data: { ...data, userId: user.id } });
      const p = await tx.product.findUniqueOrThrow({ where: { id: product.id }, select: { rating: true, reviewCount: true } });
      const count = p.reviewCount + 1;
      const rating = Math.round(((p.rating * p.reviewCount + data.rating) / count) * 10) / 10;
      await tx.product.update({ where: { id: product.id }, data: { rating, reviewCount: count } });
    });
    revalidatePath(`/produto/${product.slug}`);
    return null;
  });
}

/** Busca ao vivo (header / quick search) */
export async function searchProductsAction(q: unknown) {
  const parsed = shopQuerySchema.parse({ q });
  if (!parsed.q || parsed.q.length < 2) return [];
  const results = await getProducts({ q: parsed.q });
  return results.slice(0, 6).map((p) => ({ id: p.id, slug: p.slug, name: p.name, priceCents: p.priceCents, image: p.images[0]?.url ?? null, category: p.category.name }));
}

/** Favoritos de visitante (ids do localStorage) */
export async function getProductsByIdsAction(ids: unknown) {
  const list = z.array(z.string().regex(/^[a-z0-9]{10,40}$/i)).max(100).safeParse(ids);
  if (!list.success || list.data.length === 0) return [];
  return db.product.findMany({ where: { id: { in: list.data }, active: true, deletedAt: null }, select: productCardSelect });
}
