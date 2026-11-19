"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Apenas o digest — sem detalhes sensíveis no cliente
    console.error("Erro:", error.digest);
  }, [error]);
  return (
    <section className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-3xl font-extrabold">Algo saiu do ritmo</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Tivemos um problema ao carregar esta página. Tente novamente em instantes.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Código: {error.digest}</p>}
      <Button className="mt-8" onClick={reset}>Tentar novamente</Button>
    </section>
  );
}
