"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

const NEXT: Record<string, { to: string; label: string; variant?: "accent" | "outline" | "destructive" }[]> = {
  PENDING: [{ to: "PAID", label: "Marcar como pago", variant: "accent" }, { to: "CANCELLED", label: "Cancelar", variant: "destructive" }],
  PAID: [{ to: "SHIPPED", label: "Marcar como enviado", variant: "accent" }, { to: "CANCELLED", label: "Cancelar e devolver estoque", variant: "destructive" }],
  SHIPPED: [{ to: "DELIVERED", label: "Marcar como entregue", variant: "accent" }],
  DELIVERED: [],
  CANCELLED: [],
};

export function OrderStatusActions({ orderId, status }: { orderId: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const actions = NEXT[status] ?? [];
  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2 rounded-md bg-card p-4">
      <span className="mr-2 self-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</span>
      {actions.map((a) => (
        <Button
          key={a.to}
          size="sm"
          variant={a.variant}
          disabled={pending}
          onClick={() => {
            if (a.to === "CANCELLED" && !confirm("Confirmar cancelamento? O estoque será devolvido.")) return;
            start(async () => {
              const res = await updateOrderStatusAction(orderId, a.to);
              if (res.ok) {
                toast.success("Status atualizado");
                router.refresh();
              } else toast.error(res.error);
            });
          }}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
