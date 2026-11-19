import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatBRL, ORDER_STATUS_LABEL, cn } from "@/lib/utils";
import { orderStatusSchema } from "@/lib/validators";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const metadata = { title: "Pedidos" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = orderStatusSchema.safeParse(status).success ? (status as OrderStatus) : undefined;
  const [orders, counts] = await Promise.all([
    db.order.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true } }, _count: { select: { items: true } } } }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Pedidos</h1>
      <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto">
        <Link href="/admin/pedidos" className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold", !filter && "border-ink bg-ink text-paper")}>Todos</Link>
        {Object.entries(ORDER_STATUS_LABEL).map(([k, l]) => (
          <Link key={k} href={`/admin/pedidos?status=${k}`} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold", filter === k && "border-ink bg-ink text-paper")}>
            {l} ({countOf(k)})
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-md bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Pedido</th><th>Cliente</th><th>Data</th><th>Itens</th><th>Status</th><th className="p-4 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-paper">
                <td className="p-4"><Link href={`/admin/pedidos/${o.id}`} className="font-mono font-bold hover:underline">{o.number}</Link></td>
                <td>{o.user.name ?? "—"}</td>
                <td>{o.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                <td>{o._count.items}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="p-4 text-right font-semibold">{formatBRL(o.totalCents)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Nenhum pedido.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
