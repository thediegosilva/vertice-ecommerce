"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CreditCard, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { confirmMockPaymentAction } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

export function MockPay({ orderId, number, totalCents }: { orderId: string; number: string; totalCents: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="container max-w-md py-16">
      <div className="rounded-lg bg-card p-8 shadow-sm">
        <p className="mb-6 flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <FlaskConical className="size-4 shrink-0" /> Modo desenvolvimento: STRIPE_SECRET_KEY não configurada. Este pagamento é simulado e não existe em produção.
        </p>
        <p className="text-sm text-muted-foreground">Pedido {number}</p>
        <p className="mt-1 font-display text-4xl font-black">{formatBRL(totalCents)}</p>
        <div className="mt-6 flex items-center gap-3 rounded-md border p-4 font-mono text-sm">
          <CreditCard className="size-5" /> 4242 4242 4242 4242 · 12/34 · 123
        </div>
        <Button
          variant="accent"
          size="lg"
          className="mt-6 w-full"
          disabled={pending}
          data-testid="mock-pay"
          onClick={() =>
            start(async () => {
              const res = await confirmMockPaymentAction(orderId);
              if (res.ok) router.push(`/checkout/sucesso?pedido=${res.data.number}`);
              else toast.error(res.error);
            })
          }
        >
          {pending ? "Processando…" : "Pagar agora"}
        </Button>
      </div>
    </div>
  );
}
