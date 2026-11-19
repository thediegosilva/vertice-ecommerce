import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { db } from "@/lib/db";
import { pageUser } from "@/lib/auth-guard";
import { formatBRL } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meus pedidos", robots: { index: false } };

export default async function OrdersPage() {
  const user = await pageUser();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { image: true, name: true }, take: 4 } },
  });
  return (
    <section>
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase">Meus pedidos</h2>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed py-16 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="mt-4 font-display text-xl font-bold">Você ainda não fez pedidos</p>
          <Button asChild className="mt-6"><Link href="/shop">Começar a comprar</Link></Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/conta/pedidos/${o.number}`} className="flex flex-wrap items-center gap-4 rounded-md bg-card p-5 transition hover:shadow-md">
                <div className="flex -space-x-3">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="relative size-12 overflow-hidden rounded-full border-2 border-white bg-stone2">
                      {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                  ))}
                </div>
                <div className="min-w-40 flex-1">
                  <p className="font-mono text-sm font-bold">{o.number}</p>
                  <p className="text-xs text-muted-foreground">{o.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <OrderStatusBadge status={o.status} />
                <p className="w-28 text-right font-bold">{formatBRL(o.totalCents)}</p>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
