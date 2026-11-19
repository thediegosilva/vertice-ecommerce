import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { Rating } from "@/components/rating";
import { Button } from "@/components/ui/button";
import { Reveal, SplitWords } from "@/components/fx/reveal";
import { KineticBand } from "@/components/fx/kinetic-band";
import { AnimatedNumber } from "@/components/fx/animated-number";
import { getCategories, getFeatured } from "@/lib/products";

const u = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const TESTIMONIALS = [
  { name: "Marina Costa", city: "São Paulo, SP", avatar: u("1494790108377-be9c29b29330", 160), text: "A qualidade da Bomber Atlas é absurda. Chegou em 2 dias, embalagem impecável. Virei cliente fiel.", product: "Jaqueta Bomber Atlas" },
  { name: "Rafael Lima", city: "Belo Horizonte, MG", avatar: u("1507003211169-0a1dd7228f2d", 160), text: "O Fluxo Runner é o tênis mais confortável que já usei. Treino de manhã e vou pro trabalho com ele.", product: "Tênis Fluxo Runner" },
  { name: "Júlia Andrade", city: "Curitiba, PR", avatar: u("1438761681033-6461ffad8d80", 160), text: "Atendimento rápido, troca sem burocracia e o Âmbar N°7 tem uma fixação incrível. Recomendo demais!", product: "Perfume Âmbar N°7" },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeatured(), getCategories()]);

  return (
    <>
      <Hero />

      {/* Categorias */}
      <section id="categorias" className="container scroll-mt-24 py-20 md:py-28" aria-labelledby="cat-title">
        <SectionHeading eyebrow="Explore" title="Categorias" href="/shop" linkLabel="Ver tudo" />
        <h2 id="cat-title" className="sr-only">Categorias</h2>
        <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {categories.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.08} className="w-[62vw] shrink-0 snap-start sm:w-[38vw] md:w-auto">
            <Link href={`/shop?category=${c.slug}`} data-tilt data-spotlight className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-stone2">
              {c.image && <Image src={c.image.replace("w=1200", "w=600")} alt="" fill sizes="(min-width:768px) 20vw, 60vw" className="object-cover transition duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                <div>
                  <p className="font-display text-xl font-extrabold uppercase">{c.name}</p>
                  <p className="text-xs text-white/70">{c._count.products} {c._count.products === 1 ? "produto" : "produtos"}</p>
                </div>
                <ArrowUpRight className="size-5 transition group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <KineticBand />

      {/* Destaques */}
      <section className="container py-20 md:py-28" aria-label="Produtos em destaque">
        <SectionHeading eyebrow="Mais desejados" title="Em destaque" href="/shop" linkLabel="Ver coleção" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Editorial */}
      <section id="lookbook" className="bg-night text-chalk" aria-labelledby="editorial-title">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[420px] overflow-hidden lg:min-h-[680px]">
            <Image data-parallax="0.06" src={u("1488161628813-04466f872be2", 1600)} alt="Editorial VÉRTICE: modelo sentado em moldura circular com vista para a cidade" fill sizes="(min-width:1024px) 50vw, 100vw" className="scale-110 object-cover" />
          </div>
          <Reveal className="reveal-words flex flex-col justify-center gap-8 px-6 py-16 md:px-16 lg:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-flame" data-scramble="">Editorial · Lookbook 26</p>
            <h2 id="editorial-title" className="font-display text-4xl font-black uppercase leading-[0.95] md:text-6xl">
              <SplitWords text="Feito para quem não para." accent="para." />
            </h2>
            <p className="max-w-md text-white/70">
              Linhas limpas, tecidos técnicos e cores que conversam com o concreto. A nova coleção nasceu nas ruas — e foi pensada para acompanhar cada movimento do seu dia.
            </p>
            <div className="grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-8">
              {([[30, 0, "", "dias para troca"], [10, 0, "x", "sem juros"], [4.9, 1, "", "nota média"]] as const).map(([n, d, suf, l]) => (
                <div key={l}>
                  <p className="font-display text-3xl font-black text-flame"><AnimatedNumber value={n} decimals={d} suffix={suf} inView /></p>
                  <p className="text-xs uppercase tracking-wider text-white/60">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button asChild variant="accent" size="lg"><Link href="/lookbook" data-magnetic="0.25">Ver Lookbook</Link></Button>
              <Button asChild variant="outline-light" size="lg"><Link href="/shop?category=vestuario" data-magnetic="0.25">Comprar vestuário</Link></Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="container py-20 md:py-28" aria-labelledby="test-title">
        <Reveal className="reveal-words mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-flame" data-scramble="">+12 mil clientes</p>
          <h2 id="test-title" className="font-display text-3xl font-black uppercase md:text-5xl"><SplitWords text="Quem veste, aprova" /></h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal as="figure" key={t.name} delay={i * 0.12} data-spotlight data-tilt className="glow-border flex flex-col rounded-md border border-stone2 bg-card p-8">
              <Quote className="size-8 text-flame" aria-hidden />
              <Rating value={5} className="mt-4" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed">“{t.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-stone2 pt-6">
                <Image src={t.avatar} alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.city} · comprou {t.product}</p>
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container" aria-labelledby="nl-title">
        <Reveal data-spotlight style={{ "--spot": "255 255 255" } as React.CSSProperties} className="relative overflow-hidden rounded-lg bg-flame px-6 py-14 text-white md:px-16 md:py-20">
          <div className="pointer-events-none absolute -right-10 -top-10 font-display text-[220px] font-black leading-none text-white/10" data-parallax="-0.05" aria-hidden>V.</div>
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 id="nl-title" className="font-display text-3xl font-black uppercase leading-none md:text-5xl">Ganhe 10% OFF<br />na primeira compra</h2>
              <p className="mt-4 max-w-md text-white/85">Assine a newsletter e receba lançamentos, drops exclusivos e o cupom <b>VERTICE10</b>.</p>
            </div>
            <div className="rounded-md bg-card p-2">
              <NewsletterForm />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
