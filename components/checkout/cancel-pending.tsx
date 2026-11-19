"use client";

import { useEffect, useRef } from "react";
import { cancelMyPendingOrderAction } from "@/actions/checkout";

/** Ao voltar do Stripe sem pagar, libera imediatamente o estoque reservado. */
export function CancelPending({ orderId, number }: { orderId: string; number: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    cancelMyPendingOrderAction(orderId).catch(() => {});
  }, [orderId]);
  return (
    <div role="status" className="mb-8 rounded-md bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
      O pagamento do pedido <b>{number}</b> não foi concluído e ele foi cancelado. Seus itens continuam no carrinho — tente novamente quando quiser.
    </div>
  );
}
