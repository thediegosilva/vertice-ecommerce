import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SplitWords } from "@/components/fx/reveal";

export function SectionHeading({ eyebrow, title, href, linkLabel, center = false }: { eyebrow: string; title: string; href?: string; linkLabel?: string; center?: boolean }) {
  return (
    <div className={center ? "mb-12 text-center" : "mb-10 flex items-end justify-between gap-6"}>
      <Reveal className="reveal-words">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-flame" data-scramble="">{eyebrow}</p>
        <h2 className="font-display text-3xl font-black uppercase leading-none md:text-5xl">
          <SplitWords text={title} />
        </h2>
      </Reveal>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1 text-sm font-bold uppercase tracking-wider transition-colors hover:text-flame md:flex" data-magnetic="0.2">
          {linkLabel} <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
