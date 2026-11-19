import { db } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CouponForm, CouponToggle } from "@/components/admin/coupon-form";

export const metadata = { title: "Cupons" };

export default async function AdminCoupons() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black uppercase">Cupons</h1>
      <CouponForm />
      <div className="overflow-x-auto rounded-md bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Código</th><th>Desconto</th><th>Mínimo</th><th>Usos</th><th>Validade</th><th>Status</th><th className="p-4" /></tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="p-4 font-mono font-bold">{c.code}</td>
                <td>{c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}</td>
                <td>{c.minSubtotalCents ? formatBRL(c.minSubtotalCents) : "—"}</td>
                <td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td>{c.expiresAt ? c.expiresAt.toLocaleDateString("pt-BR") : "Sem validade"}</td>
                <td>{c.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}</td>
                <td className="p-4 text-right"><CouponToggle id={c.id} active={c.active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
