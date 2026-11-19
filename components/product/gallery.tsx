"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col" role="tablist" aria-label={`Fotos de ${name}`}>
          {images.map((img, i) => (
            <button
              key={img.url}
              role="tab"
              aria-selected={active === i}
              aria-label={`Foto ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn("relative aspect-[4/5] w-16 overflow-hidden rounded border-2 transition md:w-20", active === i ? "border-ink" : "border-transparent opacity-60 hover:opacity-100")}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-md bg-stone2">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div key={current.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
              <Image src={current.url} alt={current.alt} fill priority={active === 0} sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
