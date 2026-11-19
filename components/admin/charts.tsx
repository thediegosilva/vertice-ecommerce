"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { formatBRL } from "@/lib/utils";
import { useTheme } from "@/components/theme";

function useChartColors() {
  const { resolved } = useTheme();
  return resolved === "dark"
    ? { grid: "#2A2926", muted: "#A3A19C", text: "#F2F0EB", cursor: "rgba(242,240,235,0.06)" }
    : { grid: "#E8E6E1", muted: "#6b6b6b", text: "#111111", cursor: "rgba(17,17,17,0.05)" };
}

const ACCENT = "#FF4D00";

function SalesTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { revenue: number; orders: number };
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 flex items-center gap-2"><span className="size-2 rounded-sm" style={{ background: ACCENT }} />{formatBRL(p.revenue)}</p>
      <p className="text-muted-foreground">{p.orders} {p.orders === 1 ? "pedido" : "pedidos"}</p>
    </div>
  );
}

export function SalesChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const c = useChartColors();
  return (
    <div className="h-72" role="img" aria-label="Receita por dia nos últimos 14 dias">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: c.muted }} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: c.muted }} tickFormatter={(v: number) => (v >= 100000 ? `R$${Math.round(v / 100000)}k` : `R$${Math.round(v / 100)}`)} />
          <Tooltip content={<SalesTooltip />} cursor={{ fill: c.cursor }} />
          <Bar dataKey="revenue" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { name: string; quantity: number; revenue: number };
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{p.name}</p>
      <p>{p.quantity} unidades · {formatBRL(p.revenue)}</p>
    </div>
  );
}

export function TopProductsChart({ data }: { data: { name: string; quantity: number; revenue: number }[] }) {
  const c = useChartColors();
  return (
    <div style={{ height: Math.max(160, data.length * 44) }} role="img" aria-label="Produtos mais vendidos por unidades">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={170} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: c.text }} />
          <Tooltip content={<TopTooltip />} cursor={{ fill: c.cursor }} />
          <Bar dataKey="quantity" fill={ACCENT} radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: "right", fontSize: 11, fill: c.text }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
