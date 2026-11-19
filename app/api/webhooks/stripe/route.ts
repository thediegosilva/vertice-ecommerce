import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { cancelOrder, markOrderPaid } from "@/lib/orders";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function orderFromSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return null;
  const order = await db.order.findUnique({ where: { id: orderId } });
  // Confere que a sessão é realmente a deste pedido
  if (!order || (order.stripeSessionId && order.stripeSessionId !== session.id)) return null;
  return order;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });

  let event: Stripe.Event;
  try {
    // Corpo CRU + assinatura: impede webhooks forjados
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    logger.warn("stripe.webhook_invalid_signature");
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status !== "paid") break;
        const order = await orderFromSession(session);
        if (!order) break;
        const result = await markOrderPaid(order.id, {
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          amountTotal: session.amount_total,
        });
        if (!result.ok) logger.error("stripe.mark_paid_failed", { orderId: order.id, reason: result.reason });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const order = await orderFromSession(event.data.object);
        if (order?.status === "PENDING") await cancelOrder(order.id, "Pagamento não concluído");
        break;
      }
      default:
        break;
    }
  } catch (e) {
    logger.error("stripe.webhook_handler_error", { type: event.type, error: e });
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 }); // Stripe fará retry
  }
  return NextResponse.json({ received: true });
}
