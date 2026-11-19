import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Lookbook", description: "Lookbook VÉRTICE Outono/Inverno 26 — moda urbana com design autoral." };

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;
const LOOKS = [
  { img: u("1520975954732-35dd22299614"), title: "Concreto", text: "Couro, preto absoluto e atitude. O look que abre a coleção.", href: "/shop?category=vestuario", span: "md:col-span-2 md:row-span-2" },
  { img: u("1509631179647-0177331693ae"), title: "Contraste", text: "Listras, cor e movimento.", href: "/shop", span: "" },
  { img: u("1529139574466-a303027c1d8b"), title: "Sinal vermelho", text: "Acessórios que falam alto.", href: "/shop?category=acessorios", span: "" },
  { img: u("1488161628813-04466f872be2"), title: "Horizonte", text: "Tons terrosos para a cidade que acorda cedo.", href: "/shop?category=vestuario", span: "md:col-span-2" },
  { img: u("1515886657613-9f3515b0c78f"), title: "Quadra", text: "Conforto oversized para o fim de semana.", href: "/shop?category=vestuario", span: "" },
  { img: u("1534030347209-467a5b0ad3e6"), title: "Expediente", text: "Alfaiataria moderna, sem rigidez.", href: "/shop", span: "" },
  { img: u("1539109136881-3be0616acf4b"), title: "Viagem", text: "Camadas leves para o frio europeu.", href: "/shop?category=acessorios", span: "md:col-span-2" },
];

export default function LookbookPage() {
  return (
    <div className="container py-12 md:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-flame">Outono / Inverno 26</p>
      <h1 className="mt-2 max-w-4xl font-display text-5xl font-black uppercase leading-[0.9] md:text-8xl">Lookbook<span className="text-flame">.</span></h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">Sete looks, uma cidade. Fotografado nas ruas para quem vive em movimento.</p>
      <div className="mt-12 grid auto-rows-[340px] gap-4 md:grid-cols-4 md:auto-rows-[300px]">
        {LOOKS.map((l, i) => (
          <Link key={l.title} href={l.href} className={`group relative overflow-hidden rounded-md bg-stone2 ${l.span}`}>
            <Image src={l.img} alt={`Look ${l.title}`} fill priority={i === 0} sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-bold text-flame">LOOK {String(i + 1).padStart(2, "0")}</p>
              <p className="font-display text-2xl font-black uppercase">{l.title}</p>
              <p className="text-sm text-white/80">{l.text}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-16 text-center">
        <Button asChild size="lg" variant="accent"><Link href="/shop">Comprar a coleção</Link></Button>
      </div>
    </div>
  );
}
