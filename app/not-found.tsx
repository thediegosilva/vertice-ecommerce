import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-[120px] font-black leading-none text-stone2 md:text-[180px]">404</p>
      <h1 className="-mt-6 font-display text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-muted-foreground">O caminho que você procurou não existe ou foi movido. Que tal voltar para a coleção?</p>
      <div className="mt-8 flex gap-3">
        <Button asChild><Link href="/shop">Ver coleção</Link></Button>
        <Button asChild variant="outline"><Link href="/">Início</Link></Button>
      </div>
    </section>
  );
}
