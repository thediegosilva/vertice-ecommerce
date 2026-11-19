"use client";

import { useEffect, useRef } from "react";
import { celebrate } from "@/lib/confetti";

/** Dispara confete uma única vez (ex.: pedido confirmado). */
export function Celebrate() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const t = setTimeout(celebrate, 250);
    return () => clearTimeout(t);
  }, []);
  return null;
}
