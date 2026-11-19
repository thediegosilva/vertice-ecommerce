import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { SalesChart, TopProductsChart } from "@/components/admin/charts";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { Reveal } from "@/components/fx/reveal";

export const metadata = { title: "Dashboard" };

const PAID = ["PAID", "SHIPPED", "DELIVERED"] as const;

export default async function AdminDashboard() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 13);
  const since30 = new Date(Date.now() - 30 * 86_400_000);

  const [paid14, agg30, pendingCount, lowStock, top, recent, customers] = await Promise.all([
    db.order.findMany({ where: { status: { in: [...PAID] }, paidAt: { gte: since } }, select: { paidAt: true, totalCents: true } }),
    db.order.aggregate({ where: { status: { in: [...PAID] }, paidAt: { gte: since30 } }, _sum: { totalCents: true }, _count: true }),
    db.order.count({ where: { status: "PENDING" } }),
    db.product.findMany({ where: { deletedAt: null, stock: { lte: 10 } }, select: { id: true, name: true, stock: true }, orderBy: { stock: "asc" } }),
    db.orderItem.groupBy({ by: ["productId", "name"], where: { order: { status: { in: [...PAID] } } }, _sum: { quantity: true, unitPriceCents: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, number: true, status: true, totalCents: true, email: true, createdAt: true } }),
    db.user.count({ where: { role: "USER" } }),
  ]);

  // Receita por dia (14 dias), dias sem venda = 0
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return d;
  });
  const sales = days.map((d) => {
    const key = d.toDateString();
    const list = paid14.filter((o) => o.paidAt && o.paidAt.toDateString() === key);
    return { day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), revenue: list.reduce((a, o) => a + o.totalCents, 0), orders: list.length };
  });

  const revenue30 = agg30._sum.totalCents ?? 0;
  const count30 = agg30._count;
  const topData = await Promise.all(
    top.map(async (t) => {
      const items = await db.orderItem.findMany({ where: { productId: t.productId, order: { status: { in: [...PAID] } } }, select: { quantity: true, unitPriceCents: true } });
      return { name: t.name, quantity: t._sum.quantity ?? 0, revenue: items.reduce((a, i) => a + i.quantity * i.unitPriceCents, 0) };
    }),
  );

  const kpis: [string, number, boolean][] = [
    ["Receita (30 dias)", revenue30, true],
    ["Pedidos pagos (30 dias)", count30, false],
    ["Ticket médio", count30 ? Math.round(revenue30 / count30) : 0, true],
    ["Clientes", customers, false],
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-black uppercase md:text-4xl">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map(([l, v, money], i) => (
          <Reveal key={l} delay={i * 0.06} data-spotlight className="rounded-md bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className="mt-2 font-display text-2xl font-black md:text-3xl"><AnimatedNumber value={v} money={money} inView /></p>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md bg-card p-6">
          <h2 className="font-semibold">Receita por dia</h2>
          <p className="mb-4 text-xs text-muted-foreground">Pedidos pagos · últimos 14 dias</p>
          <SalesChart data={sales} />
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground">Ver tabela</summary>
            <table className="mt-2 w-full">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Dia</th><th>Pedidos</th><th className="text-right">Receita</th></tr></thead>
              <tbody>{sales.map((s) => <tr key={s.day} className="border-t"><td className="py-1">{s.day}</td><td>{s.orders}</td><td className="text-right">{formatBRL(s.revenue)}</td></tr>)}</tbody>
            </table>
          </details>
        </section>
        <section className="rounded-md bg-card p-6">
          <h2 className="font-semibold">Mais vendidos</h2>
          <p className="mb-4 text-xs text-muted-foreground">Unidades vendidas (pedidos pagos)</p>
          {topData.length ? <TopProductsChart data={topData} /> : <p className="py-10 text-center text-sm text-muted-foreground">Sem vendas ainda.</p>}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-md bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs font-semibold underline">Ver todos ({pendingCount} pendentes)</Link>
          </div>
          <ul className="divide-y text-sm">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-paper">
                  <span className="font-mono text-xs font-bold">{o.number}</span>
                  <span className="flex-1 truncate text-muted-foreground">{o.createdAt.toLocaleDateString("pt-BR")}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="w-24 text-right font-semibold">{formatBRL(o.totalCents)}</span>
                </Link>
              </li>
            ))}
            {recent.length === 0 && <li className="py-6 text-center text-muted-foreground">Nenhum pedido ainda.</li>}
          </ul>
        </section>
        <section className="rounded-md bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-flame" /> Estoque baixo (≤ 10)</h2>
          <ul className="divide-y text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between py-3">
                <Link href={`/admin/produtos/${p.id}`} className="hover:underline">{p.name}</Link>
                <span className={p.stock === 0 ? "font-bold text-destructive" : "font-semibold"}>{p.stock === 0 ? "Esgotado" : `${p.stock} un.`}</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="py-6 text-center text-muted-foreground">Tudo abastecido.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
