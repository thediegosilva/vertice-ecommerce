"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runAction, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cuidSchema } from "@/lib/validators";

export async function getWishlistIdsAction(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const rows = await db.wishlist.findMany({ where: { userId: session.user.id }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function toggleWishlistAction(productId: string): Promise<ActionResult<{ saved: boolean }>> {
  return runAction("wishlist_toggle", async () => {
    const user = await requireUser();
    await enforceRateLimit("write");
    cuidSchema.parse(productId);
    const existing = await db.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    const product = await db.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true } });
    if (!product) return { saved: false };
    await db.wishlist.create({ data: { userId: user.id, productId } });
    return { saved: true };
  });
}

/** Sincroniza favoritos do localStorage ao logar. */
export async function syncWishlistAction(ids: unknown): Promise<ActionResult<string[]>> {
  return runAction("wishlist_sync", async () => {
    const user = await requireUser();
    await enforceRateLimit("write");
    const list = z.array(cuidSchema).max(100).parse(ids);
    if (list.length) {
      const valid = await db.product.findMany({ where: { id: { in: list }, deletedAt: null }, select: { id: true } });
      await db.wishlist.createMany({ data: valid.map((p) => ({ userId: user.id, productId: p.id })), skipDuplicates: true });
    }
    const rows = await db.wishlist.findMany({ where: { userId: user.id }, select: { productId: true } });
    return rows.map((r) => r.productId);
  });
}
