"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCouponAction, toggleCouponAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CouponForm() {
  const [f, setF] = useState({ code: "", type: "PERCENT", value: "", min: "", maxUses: "", expiresAt: "" });
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveCouponAction(null, {
            code: f.code,
            type: f.type,
            value: f.type === "PERCENT" ? Number(f.value) : Math.round(Number(f.value.replace(",", ".")) * 100),
            minSubtotalCents: f.min ? Math.round(Number(f.min.replace(",", ".")) * 100) : 0,
            maxUses: f.maxUses ? Number(f.maxUses) : null,
            expiresAt: f.expiresAt || null,
            active: true,
          });
          if (res.ok) {
            toast.success("Cupom criado");
            setF({ code: "", type: "PERCENT", value: "", min: "", maxUses: "", expiresAt: "" });
            router.refresh();
          } else toast.error(res.error);
        });
      }}
      className="grid items-end gap-4 rounded-md bg-card p-6 sm:grid-cols-3 xl:grid-cols-7"
    >
      <div><Label htmlFor="c-code">Código</Label><Input id="c-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} required maxLength={30} className="mt-1.5 uppercase" /></div>
      <div>
        <Label htmlFor="c-type">Tipo</Label>
        <NativeSelect id="c-type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="mt-1.5"><option value="PERCENT">%</option><option value="FIXED">R$</option></NativeSelect>
      </div>
      <div><Label htmlFor="c-value">Valor</Label><Input id="c-value" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required inputMode="decimal" className="mt-1.5" /></div>
      <div><Label htmlFor="c-min">Mínimo (R$)</Label><Input id="c-min" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} inputMode="decimal" className="mt-1.5" /></div>
      <div><Label htmlFor="c-max">Máx. usos</Label><Input id="c-max" type="number" min={1} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} className="mt-1.5" /></div>
      <div><Label htmlFor="c-exp">Expira em</Label><Input id="c-exp" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className="mt-1.5" /></div>
      <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar cupom"}</Button>
    </form>
  );
}

export function CouponToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => { const r = await toggleCouponAction(id); if (r.ok) router.refresh(); else toast.error(r.error); })}>
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
