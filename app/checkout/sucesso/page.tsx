import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutoRefresh } from "@/components/auto-refresh";
import { RefreshCart } from "@/components/refresh-cart";
import { Celebrate } from "@/components/fx/celebrate";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { pedido } = await searchParams;
  if (typeof pedido !== "string" || pedido.length > 40) notFound();
  // Anti-IDOR: busca pelo número E pelo dono
  const order = await db.order.findFirst({ where: { number: pedido, userId: session.user.id }, include: { items: true } });
  if (!order) notFound();
  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";

  return (
    <div className="container max-w-2xl py-16 text-center">
      {paid ? <CheckCircle2 className="mx-auto size-16 animate-in zoom-in-50 spin-in-12 text-emerald-600 duration-700" /> : <Clock className="mx-auto size-16 animate-pulse text-flame" />}
      <h1 className="mt-6 font-display text-4xl font-black uppercase">{paid ? "Pedido confirmado!" : "Processando pagamento…"}</h1>
      <p className="mt-3 text-muted-foreground">
        {paid ? <>Obrigado pela compra! Enviamos a confirmação para <b>{order.email}</b>.</> : "Estamos aguardando a confirmação do Stripe. Esta página atualiza sozinha."}
      </p>
      {!paid && order.status === "PENDING" && <AutoRefresh seconds={3} />}
      {paid && <RefreshCart />}
      {paid && <Celebrate />}
      <div className="mt-10 rounded-md bg-card p-6 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pedido</span>
          <span className="font-mono font-bold" data-testid="order-number">{order.number}</span>
        </div>
        <ul className="my-4 divide-y border-y text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-3">
              <span>{i.quantity}× {i.name}{i.size && ` · ${i.size}`}</span>
              <span>{formatBRL(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.discountCents > 0 && <p className="flex justify-between text-sm text-emerald-700 dark:text-emerald-400"><span>Desconto {order.couponCode}</span><span>−{formatBRL(order.discountCents)}</span></p>}
        <p className="flex justify-between text-sm"><span>Frete</span><span>{order.shippingCents ? formatBRL(order.shippingCents) : "Grátis"}</span></p>
        <p className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatBRL(order.totalCents)}</span></p>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild><Link href={`/conta/pedidos/${order.number}`}>Acompanhar pedido</Link></Button>
        <Button asChild variant="outline"><Link href="/shop">Continuar comprando</Link></Button>
      </div>
    </div>
  );
}
