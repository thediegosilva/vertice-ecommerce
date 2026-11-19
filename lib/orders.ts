import "server-only";
import { randomInt } from "node:crypto";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "./db";
import { computeTotals, type ShippingMethodKey } from "./pricing";
import { UserError } from "./action";
import { sendOrderConfirmation, sendOrderShipped } from "./email";
import { logger } from "./logger";
import { trackingCodeFor } from "./tracking";
import type { CheckoutInput } from "./validators";

function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `VRT-${ymd}-${randomInt(10_000, 99_999)}`;
}

/**
 * Cotação de checkout — calculada 100% no servidor com dados do banco.
 */
export async function quoteForUser(userId: string, method: ShippingMethodKey, couponCode?: string) {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: { select: { priceCents: true, stock: true, active: true, deletedAt: true, name: true } } } } },
  });
  const items = cart?.items ?? [];
  const problems = items
    .filter((i) => !i.product.active || i.product.deletedAt || i.product.stock < i.quantity)
    .map((i) => `${i.product.name}: estoque insuficiente`);
  const coupon = couponCode ? await db.coupon.findUnique({ where: { code: couponCode } }) : null;
  const totals = computeTotals(
    items.map((i) => ({ unitPriceCents: i.product.priceCents, quantity: i.quantity })),
    { coupon: couponCode ? (coupon ?? { code: couponCode, type: "PERCENT", value: 0, minSubtotalCents: 0, maxUses: 0, usedCount: 0, expiresAt: null, active: false }) : null, method },
  );
  return { ...totals, itemCount: items.length, problems, couponApplied: !!couponCode && !totals.couponError ? couponCode : null };
}

/**
 * Cria o pedido em UMA transação atômica:
 * - revalida produtos e preços no banco
 * - decrementa estoque com condição (stock >= qty) → sem overselling
 * - reserva o uso do cupom com condição (usedCount < maxUses)
 */
export async function createOrderFromCart(user: { id: string; email: string }, input: CheckoutInput) {
  return db.$transaction(
    async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, priceCents: true, stock: true, active: true, deletedAt: true, sizes: true, colors: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } },
              },
            },
          },
        },
      });
      if (!cart || cart.items.length === 0) throw new UserError("Seu carrinho está vazio.");

      for (const item of cart.items) {
        const p = item.product;
        if (!p.active || p.deletedAt) throw new UserError(`${p.name} não está mais disponível.`);
        if (p.sizes.length && !p.sizes.includes(item.size)) throw new UserError(`Selecione um tamanho válido para ${p.name}.`);
        if (p.colors.length && item.color && !p.colors.includes(item.color)) throw new UserError(`Cor inválida para ${p.name}.`);
      }

      let coupon = null;
      if (input.couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: input.couponCode } });
        if (!coupon) throw new UserError("Cupom inválido.");
      }

      const totals = computeTotals(
        cart.items.map((i) => ({ unitPriceCents: i.product.priceCents, quantity: i.quantity })),
        { coupon, method: input.shippingMethod },
      );
      if (totals.couponError) throw new UserError(totals.couponError);

      // Decremento atômico condicional de estoque
      for (const item of cart.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity }, active: true, deletedAt: null },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count !== 1) throw new UserError(`Estoque insuficiente para ${item.product.name}.`);
      }

      if (coupon) {
        const res = await tx.coupon.updateMany({
          where: { id: coupon.id, active: true, ...(coupon.maxUses !== null ? { usedCount: { lt: coupon.maxUses } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (res.count !== 1) throw new UserError("Cupom esgotado.");
      }

      const order = await tx.order.create({
        data: {
          number: newOrderNumber(),
          userId: user.id,
          email: user.email,
          status: "PENDING",
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          shippingCents: totals.shippingCents,
          totalCents: totals.totalCents,
          couponId: coupon?.id,
          couponCode: coupon?.code,
          shippingMethod: input.shippingMethod,
          shippingAddress: input.address as Prisma.InputJsonValue,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              name: i.product.name,
              image: i.product.images[0]?.url ?? null,
              unitPriceCents: i.product.priceCents,
              quantity: i.quantity,
              size: i.size,
              color: i.color,
            })),
          },
          history: { create: { status: "PENDING", note: "Pedido criado" } },
        },
        include: { items: true },
      });

      if (input.saveAddress) {
        const count = await tx.address.count({ where: { userId: user.id } });
        if (count < 10) {
          await tx.address.create({ data: { ...input.address, userId: user.id, label: "Checkout", isDefault: count === 0 } });
        }
      }
      return order;
    },
    { isolationLevel: "ReadCommitted", timeout: 15_000 },
  );
}

/** Idempotente: só transiciona PENDING → PAID uma vez. */
export async function markOrderPaid(orderId: string, info: { paymentIntentId?: string | null; amountTotal?: number | null }) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true, user: { select: { name: true } } } });
  if (!order) return { ok: false as const, reason: "not_found" };
  if (typeof info.amountTotal === "number" && info.amountTotal !== order.totalCents) {
    logger.error("payment.amount_mismatch", { orderId, expected: order.totalCents, got: info.amountTotal });
    return { ok: false as const, reason: "amount_mismatch" };
  }
  const updated = await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date(), stripePaymentIntentId: info.paymentIntentId ?? undefined },
    });
    if (res.count === 0) return false;
    await tx.orderStatusHistory.create({ data: { orderId, status: "PAID", note: "Pagamento confirmado" } });
    // Pedido pago: limpa o carrinho do cliente
    await tx.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });
    return true;
  });
  if (updated) {
    await sendOrderConfirmation({ ...order, customerName: order.user.name }).catch((e) => logger.error("email.order_failed", e));
    logger.info("order.paid", { orderId, number: order.number });
  }
  return { ok: true as const, updated };
}

/** Cancela e devolve estoque/cupom (somente a partir de PENDING ou PAID). */
export async function cancelOrder(orderId: string, note = "Pedido cancelado") {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return false;
    const res = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "PAID"] } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (res.count === 0) return false;
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    if (order.couponId) {
      await tx.coupon.updateMany({ where: { id: order.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
    }
    await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note } });
    return true;
  });
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function transitionOrder(orderId: string, to: OrderStatus) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new UserError("Pedido não encontrado");
  if (!ALLOWED_TRANSITIONS[order.status].includes(to)) throw new UserError(`Transição inválida: ${order.status} → ${to}`);
  if (to === "CANCELLED") return cancelOrder(orderId, "Cancelado pelo administrador");
  if (to === "PAID") return (await markOrderPaid(orderId, {})).ok;
  const now = new Date();
  const data: Prisma.OrderUpdateManyMutationInput =
    to === "SHIPPED" ? { status: to, shippedAt: now, trackingCode: trackingCodeFor(order.number) } : { status: to, deliveredAt: now };
  await db.$transaction([
    db.order.updateMany({ where: { id: orderId, status: order.status }, data }),
    db.orderStatusHistory.create({ data: { orderId, status: to, note: to === "SHIPPED" ? "Objeto postado" : "Entregue ao destinatário" } }),
  ]);
  if (to === "SHIPPED") await sendOrderShipped(order.email, order.number, trackingCodeFor(order.number)).catch(() => {});
  return true;
}
