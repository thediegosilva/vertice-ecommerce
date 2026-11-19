"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplitChars } from "@/components/fx/reveal";
import { HeroEmbers } from "@/components/fx/hero-embers";

const HERO = "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=2400&q=80";
const ease = [0.22, 1, 0.36, 1] as const;
const LINE1 = "Vista a cidade.";
const LINE2 = "Viva o movimento.";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-104px)] items-end overflow-hidden bg-night" aria-labelledby="hero-title" data-spotlight>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image src={HERO} alt="Modelo com jaqueta de couro em cenário urbano" fill priority sizes="100vw" className="hero-kenburns object-cover object-[center_30%] opacity-90" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/40 to-night/10" aria-hidden />
      <HeroEmbers />
      <div className="container pb-14 pt-32 md:pb-20" data-parallax="-0.12">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white backdrop-blur">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-flame opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-flame" />
          </span>
          <span data-scramble="200">Coleção Outono/Inverno 26</span>
        </motion.p>
        <h1 id="hero-title" aria-label={`${LINE1} ${LINE2}`} className="font-display text-[13vw] font-black uppercase leading-[0.86] tracking-[-0.03em] text-white md:text-[min(120px,calc((100vw_-_4.5rem)/11))]">
          <span className="block pb-1" aria-hidden><SplitChars text={LINE1} /></span>
          <span className="block pb-1 text-flame" aria-hidden><SplitChars text={LINE2} offset={LINE1.length} /></span>
        </h1>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.9, ease }} className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-base leading-relaxed text-white/80 md:text-lg">Peças essenciais, tecnologia e acessórios com design autoral para quem faz da cidade o seu palco.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent" className="group shadow-[0_10px_40px_-10px_rgba(255,77,0,0.7)]">
              <Link href="/shop" data-magnetic="0.3">Ver Coleção <ArrowRight className="transition-transform group-hover:translate-x-1" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline-light">
              <Link href="/lookbook" data-magnetic="0.3">Ver Lookbook</Link>
            </Button>
          </div>
        </motion.div>
      </div>
      <motion.a
        href="#categorias"
        aria-label="Rolar para as categorias"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-white/70 md:block"
      >
        <ChevronDown className="size-6" />
      </motion.a>
    </section>
  );
}
