import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { db } from "@/lib/db";
import { canAccess, pageUser } from "@/lib/auth-guard";
import { buildTracking } from "@/lib/tracking";
import { formatBRL, ORDER_STATUS_LABEL } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { CancelOrderButton } from "@/components/account/cancel-order-button";

export const metadata: Metadata = { title: "Detalhe do pedido", robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ number: string }> }) {
  const user = await pageUser();
  const { number } = await params;
  if (number.length > 40) notFound();
  const order = await db.order.findUnique({
    where: { number: decodeURIComponent(number) },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  // Anti-IDOR: só o dono (ou admin) vê o pedido; 404 para não revelar existência
  if (!order || !canAccess(user, order.userId)) notFound();

  const addr = order.shippingAddress as Record<string, string>;
  const tracking = buildTracking(order);

  return (
    <div className="space-y-8">
      <Link href="/conta/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"><ArrowLeft className="size-4" /> Meus pedidos</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-bold">{order.number}</h2>
          <p className="text-sm text-muted-foreground">Realizado em {order.createdAt.toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {order.status === "PENDING" && (
            <CancelOrderButton orderId={order.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-md bg-card p-6" aria-labelledby="track">
          <div className="mb-6 flex items-center justify-between">
            <h3 id="track" className="font-display text-lg font-extrabold uppercase">Rastreamento</h3>
            {order.trackingCode && <span className="font-mono text-xs font-bold">{order.trackingCode}</span>}
          </div>
          <ol className="relative space-y-6 border-l-2 border-stone2 pl-6">
            {tracking.map((ev, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[33px] top-0 bg-card">
                  {ev.done ? <CheckCircle2 className="size-5 text-flame" /> : <Circle className="size-5 text-stone2" />}
                </span>
                <p className={ev.done ? "font-semibold" : "text-muted-foreground"}>{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.location} · {ev.done ? ev.date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : `previsto ${ev.date.toLocaleDateString("pt-BR")}`}</p>
              </li>
            ))}
          </ol>
        </section>
        <div className="space-y-6">
          <section className="rounded-md bg-card p-6 text-sm">
            <h3 className="mb-3 font-display text-lg font-extrabold uppercase">Entrega</h3>
            <p>{addr.recipient}<br />{addr.street}, {addr.number}{addr.complement && ` — ${addr.complement}`}<br />{addr.district}, {addr.city}/{addr.state}<br />CEP {String(addr.zip).replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
            <p className="mt-3 text-muted-foreground">{order.shippingMethod === "EXPRESS" ? "Expresso" : "Padrão"}</p>
          </section>
          <section className="rounded-md bg-card p-6 text-sm">
            <h3 className="mb-3 font-display text-lg font-extrabold uppercase">Histórico</h3>
            <ul className="space-y-2">
              {order.history.map((h) => (
                <li key={h.id} className="flex justify-between gap-4">
                  <span><b>{ORDER_STATUS_LABEL[h.status]}</b>{h.note && <span className="text-muted-foreground"> — {h.note}</span>}</span>
                  <time className="shrink-0 text-xs text-muted-foreground">{h.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="rounded-md bg-card p-6">
        <h3 className="mb-4 font-display text-lg font-extrabold uppercase">Itens</h3>
        <ul className="divide-y">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <div className="relative size-16 overflow-hidden rounded bg-stone2">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</div>
              <div className="flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">{[i.size && `Tam. ${i.size}`, i.color, `Qtd. ${i.quantity}`].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="font-semibold">{formatBRL(i.unitPriceCents * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 max-w-xs space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div>
          {order.discountCents > 0 && <div className="flex justify-between text-emerald-700 dark:text-emerald-400"><dt>Desconto ({order.couponCode})</dt><dd>−{formatBRL(order.discountCents)}</dd></div>}
          <div className="flex justify-between"><dt>Frete</dt><dd>{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatBRL(order.totalCents)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
