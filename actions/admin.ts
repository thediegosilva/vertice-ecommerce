"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { enforceRateLimit } from "@/lib/rate-limit";
import { transitionOrder } from "@/lib/orders";
import { slugify } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { couponSchema, cuidSchema, orderStatusSchema, productSchema } from "@/lib/validators";

function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/produtos");
  if (slug) revalidatePath(`/produto/${slug}`);
}

export async function saveProductAction(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("admin_product_save", async () => {
    const admin = await requireAdmin();
    await enforceRateLimit("write");
    const data = productSchema.parse(input);
    if (data.compareAtCents && data.compareAtCents <= data.priceCents) throw new UserError("O preço antigo deve ser maior que o preço atual.");
    const slug = data.slug || slugify(data.name);
    const clash = await db.product.findFirst({ where: { slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
    if (clash) throw new UserError("Já existe um produto com este slug.");
    const category = await db.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new UserError("Categoria inválida.");

    const { images, ...fields } = data;
    const payload = { ...fields, slug, compareAtCents: data.compareAtCents ?? null, badge: data.badge || null };
    const product = await db.$transaction(async (tx) => {
      const p = id
        ? await tx.product.update({ where: { id: cuidSchema.parse(id) }, data: payload })
        : await tx.product.create({ data: payload });
      await tx.productImage.deleteMany({ where: { productId: p.id } });
      await tx.productImage.createMany({ data: images.map((img, i) => ({ ...img, productId: p.id, position: i })) });
      return p;
    });
    logger.info("admin.product_saved", { adminId: admin.id, productId: product.id });
    revalidateStore(product.slug);
    return { id: product.id };
  });
}

/** Soft delete: o produto some da loja mas permanece para histórico de pedidos. */
export async function deleteProductAction(id: string): Promise<ActionResult<null>> {
  return runAction("admin_product_delete", async () => {
    const admin = await requireAdmin();
    cuidSchema.parse(id);
    const p = await db.product.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    await db.cartItem.deleteMany({ where: { productId: id } });
    logger.info("admin.product_deleted", { adminId: admin.id, productId: id });
    revalidateStore(p.slug);
    return null;
  });
}

export async function restoreProductAction(id: string): Promise<ActionResult<null>> {
  return runAction("admin_product_restore", async () => {
    await requireAdmin();
    cuidSchema.parse(id);
    const p = await db.product.update({ where: { id }, data: { deletedAt: null, active: true } });
    revalidateStore(p.slug);
    return null;
  });
}

export async function updateStockAction(id: string, stock: unknown): Promise<ActionResult<null>> {
  return runAction("admin_stock", async () => {
    await requireAdmin();
    cuidSchema.parse(id);
    const value = z.number().int().min(0).max(1_000_000).parse(stock);
    const p = await db.product.update({ where: { id }, data: { stock: value } });
    revalidateStore(p.slug);
    return null;
  });
}

export async function saveCouponAction(id: string | null, input: unknown): Promise<ActionResult<null>> {
  return runAction("admin_coupon", async () => {
    await requireAdmin();
    const data = couponSchema.parse(input);
    const clash = await db.coupon.findFirst({ where: { code: data.code, ...(id ? { id: { not: id } } : {}) } });
    if (clash) throw new UserError("Código já existe.");
    const payload = { ...data, maxUses: data.maxUses ?? null, expiresAt: data.expiresAt ?? null };
    if (id) await db.coupon.update({ where: { id: cuidSchema.parse(id) }, data: payload });
    else await db.coupon.create({ data: payload });
    revalidatePath("/admin/cupons");
    return null;
  });
}

export async function toggleCouponAction(id: string): Promise<ActionResult<null>> {
  return runAction("admin_coupon_toggle", async () => {
    await requireAdmin();
    cuidSchema.parse(id);
    const c = await db.coupon.findUniqueOrThrow({ where: { id } });
    await db.coupon.update({ where: { id }, data: { active: !c.active } });
    revalidatePath("/admin/cupons");
    return null;
  });
}

export async function updateOrderStatusAction(orderId: string, status: unknown): Promise<ActionResult<null>> {
  return runAction("admin_order_status", async () => {
    const admin = await requireAdmin();
    cuidSchema.parse(orderId);
    const to = orderStatusSchema.parse(status);
    await transitionOrder(orderId, to);
    logger.info("admin.order_status", { adminId: admin.id, orderId, to });
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${orderId}`);
    return null;
  });
}
