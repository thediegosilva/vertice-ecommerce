"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { formatBRL } from "@/lib/utils";

/**
 * Número que "rola" até o novo valor. Em `money`, o valor é em centavos.
 * Com `inView`, só começa a contar quando aparece na tela.
 */
export function AnimatedNumber({ value, money = false, decimals = 0, suffix = "", inView = false, className, ...rest }: {
  value: number;
  money?: boolean;
  decimals?: number;
  suffix?: string;
  inView?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(inView ? 0 : value);
  const prev = useRef(inView ? 0 : value);

  useEffect(() => {
    if (inView && !visible) return;
    if (reduce) {
      setShown(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: inView ? 1.4 : 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, visible, inView, reduce]);

  const text = money ? formatBRL(Math.round(shown)) : `${shown.toFixed(decimals)}${suffix}`;
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`} {...rest}>
      {text}
    </span>
  );
}
