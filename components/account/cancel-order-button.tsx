"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { cancelMyPendingOrderAction } from "@/actions/checkout";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancelar este pedido?")) return;
        start(async () => {
          const res = await cancelMyPendingOrderAction(orderId);
          if (res.ok) {
            toast.success("Pedido cancelado");
            router.refresh();
          } else toast.error(res.error);
        });
      }}
    >
      Cancelar
    </Button>
  );
}
