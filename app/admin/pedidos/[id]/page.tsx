import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { cuidSchema } from "@/lib/validators";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/utils";
import { maskEmail } from "@/lib/logger";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";

export const metadata = { title: "Pedido" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!cuidSchema.safeParse(id).success) notFound();
  const order = await db.order.findUnique({ where: { id }, include: { items: true, history: { orderBy: { createdAt: "asc" } }, user: { select: { name: true, email: true } } } });
  if (!order) notFound();
  const a = order.shippingAddress as Record<string, string>;
  return (
    <div className="space-y-6">
      <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"><ArrowLeft className="size-4" /> Pedidos</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">{order.number}</h1>
          <p className="text-sm text-muted-foreground">{order.createdAt.toLocaleString("pt-BR")} · {order.user.name} ({maskEmail(order.user.email)})</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <OrderStatusActions orderId={order.id} status={order.status} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-md bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Itens</h2>
          <ul className="divide-y text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between py-3">
                <span>{i.quantity}× {i.name} <span className="text-muted-foreground">{[i.size, i.color].filter(Boolean).join(" · ")}</span></span>
                <span>{formatBRL(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="ml-auto mt-4 max-w-xs space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div>
            {order.discountCents > 0 && <div className="flex justify-between"><dt>Desconto ({order.couponCode})</dt><dd>−{formatBRL(order.discountCents)}</dd></div>}
            <div className="flex justify-between"><dt>Frete ({order.shippingMethod === "EXPRESS" ? "Expresso" : "Padrão"})</dt><dd>{formatBRL(order.shippingCents)}</dd></div>
            <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatBRL(order.totalCents)}</dd></div>
          </dl>
        </section>
        <div className="space-y-6">
          <section className="rounded-md bg-card p-6 text-sm">
            <h2 className="mb-2 font-semibold">Entrega</h2>
            <p>{a.recipient}<br />{a.street}, {a.number} {a.complement}<br />{a.district}, {a.city}/{a.state}<br />CEP {a.zip}</p>
            {order.trackingCode && <p className="mt-2 font-mono text-xs">Rastreio: {order.trackingCode}</p>}
          </section>
          <section className="rounded-md bg-card p-6 text-sm">
            <h2 className="mb-2 font-semibold">Pagamento</h2>
            <p className="break-all text-xs text-muted-foreground">Stripe session: {order.stripeSessionId ?? "—"}<br />Payment intent: {order.stripePaymentIntentId ?? "—"}</p>
          </section>
          <section className="rounded-md bg-card p-6 text-sm">
            <h2 className="mb-2 font-semibold">Histórico</h2>
            <ul className="space-y-1">
              {order.history.map((h) => <li key={h.id}><b>{ORDER_STATUS_LABEL[h.status]}</b> · {h.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}{h.note && <span className="text-muted-foreground"> — {h.note}</span>}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
