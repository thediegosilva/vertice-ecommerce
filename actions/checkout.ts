"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cancelOrder, createOrderFromCart, markOrderPaid, quoteForUser } from "@/lib/orders";
import { mockPaymentsEnabled, stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { checkoutSchema, couponCodeSchema, cuidSchema, shippingMethodSchema } from "@/lib/validators";

const quoteInput = z.strictObject({
  shippingMethod: shippingMethodSchema,
  couponCode: couponCodeSchema.optional(),
});

/** Totais calculados SEMPRE no servidor. O cliente só informa método de frete e código do cupom. */
export async function quoteCheckoutAction(input: unknown) {
  return runAction("quote", async () => {
    const user = await requireUser();
    await enforceRateLimit("checkout", `quote:${user.id}`);
    const { shippingMethod, couponCode } = quoteInput.parse(input);
    return quoteForUser(user.id, shippingMethod, couponCode);
  });
}

export async function placeOrderAction(input: unknown): Promise<ActionResult<{ url: string }>> {
  return runAction("place_order", async () => {
    const sessionUser = await requireUser();
    await enforceRateLimit("checkout", sessionUser.id);
    // Verifica ANTES de criar o pedido: sem meio de pagamento, nada é reservado
    if (!stripe && !mockPaymentsEnabled) throw new UserError("Pagamentos indisponíveis no momento. Tente novamente mais tarde.");
    const data = checkoutSchema.parse(input);
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { id: true, email: true } });

    const order = await createOrderFromCart(user, data);
    logger.info("order.created", { orderId: order.id, number: order.number, total: order.totalCents });

    if (stripe) {
      try {
        const discounts = order.discountCents
          ? [{ coupon: (await stripe.coupons.create({ amount_off: order.discountCents, currency: "brl", duration: "once", name: order.couponCode ?? "Desconto" })).id }]
          : undefined;
        const session = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: order.email,
            client_reference_id: order.id,
            metadata: { orderId: order.id, orderNumber: order.number },
            payment_intent_data: { metadata: { orderId: order.id } },
            line_items: order.items.map((i) => ({
              quantity: i.quantity,
              price_data: {
                currency: "brl",
                unit_amount: i.unitPriceCents, // preço vindo do BANCO
                product_data: {
                  name: i.name,
                  ...(i.image ? { images: [i.image] } : {}),
                  ...(i.size || i.color ? { description: [i.size && `Tam. ${i.size}`, i.color].filter(Boolean).join(" · ") } : {}),
                },
              },
            })),
            discounts,
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  display_name: order.shippingMethod === "EXPRESS" ? "Expresso (1-2 dias úteis)" : "Padrão (3-7 dias úteis)",
                  fixed_amount: { amount: order.shippingCents, currency: "brl" },
                },
              },
            ],
            locale: "pt-BR",
            expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
            success_url: absoluteUrl(`/checkout/sucesso?pedido=${encodeURIComponent(order.number)}`),
            cancel_url: absoluteUrl(`/checkout?cancelado=${encodeURIComponent(order.number)}`),
          },
          { idempotencyKey: `order-${order.id}` },
        );
        await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
        if (!session.url) throw new Error("Stripe não retornou URL");
        return { url: session.url };
      } catch (e) {
        // Falha no Stripe: devolve estoque/cupom
        await cancelOrder(order.id, "Falha ao iniciar pagamento");
        logger.error("stripe.session_failed", e);
        throw new UserError("Não foi possível iniciar o pagamento. Tente novamente.");
      }
    }

    // Modo desenvolvimento sem Stripe: página de pagamento simulado
    return { url: `/checkout/simulado?pedido=${encodeURIComponent(order.number)}` };
  });
}

/** Somente em desenvolvimento sem STRIPE_SECRET_KEY. */
export async function confirmMockPaymentAction(orderId: string): Promise<ActionResult<{ number: string }>> {
  return runAction("mock_pay", async () => {
    if (!mockPaymentsEnabled) throw new UserError("Indisponível.");
    const user = await requireUser();
    cuidSchema.parse(orderId);
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id } });
    if (!order) throw new UserError("Pedido não encontrado.");
    await markOrderPaid(order.id, { paymentIntentId: `mock_${order.id}`, amountTotal: order.totalCents });
    return { number: order.number };
  });
}

/** Cliente pode cancelar pedido ainda não pago. */
export async function cancelMyPendingOrderAction(orderId: string): Promise<ActionResult<null>> {
  return runAction("cancel_pending", async () => {
    const user = await requireUser();
    cuidSchema.parse(orderId);
    const order = await db.order.findFirst({ where: { id: orderId, userId: user.id, status: "PENDING" } });
    if (!order) throw new UserError("Pedido não pode ser cancelado.");
    if (stripe && order.stripeSessionId) {
      await stripe.checkout.sessions.expire(order.stripeSessionId).catch(() => {});
    }
    await cancelOrder(order.id, "Cancelado pelo cliente");
    return null;
  });
}
