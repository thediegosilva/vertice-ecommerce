"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initGlobalEffects, initPageEffects } from "@/lib/effects";

export function Effects() {
  const pathname = usePathname();
  useEffect(() => initGlobalEffects(), []);
  useEffect(() => {
    // espera o novo DOM da rota ser pintado
    let cleanup: (() => void) | undefined;
    const id = requestAnimationFrame(() => (cleanup = initPageEffects()));
    return () => {
      cancelAnimationFrame(id);
      cleanup?.();
    };
  }, [pathname]);
  return <div className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-flame via-[#FF9A5C] to-flame" aria-hidden />;
}
