"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemePref = "light" | "dark" | "system";
type Ctx = { theme: ThemePref; resolved: "light" | "dark"; setTheme: (t: ThemePref, origin?: { x: number; y: number }) => void };

import { THEME_KEY } from "@/lib/theme-script";
const ThemeContext = createContext<Ctx | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme fora do ThemeProvider");
  return ctx;
}

const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

function apply(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0C0C0B" : "#FAF9F6");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Estado inicial já aplicado pelo script inline (sem flash); aqui só sincroniza
  useEffect(() => {
    let saved: ThemePref = "system";
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") saved = v;
    } catch {
      /* storage indisponível */
    }
    setThemeState(saved);
    setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  // Segue o sistema quando a preferência é "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = mq.matches ? "dark" : "light";
      apply(r);
      setResolved(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePref, origin?: { x: number; y: number }) => {
    const next = t === "system" ? (systemDark() ? "dark" : "light") : t;
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* noop */
    }
    const commit = () => {
      apply(next);
      setThemeState(t);
      setResolved(next);
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (!doc.startViewTransition || reduce || next === (document.documentElement.classList.contains("dark") ? "dark" : "light")) {
      commit();
      return;
    }
    // Revelação circular a partir do botão clicado
    const x = origin?.x ?? window.innerWidth - 40;
    const y = origin?.y ?? 40;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement.style;
    root.setProperty("--vt-x", `${x}px`);
    root.setProperty("--vt-y", `${y}px`);
    root.setProperty("--vt-r", `${r}px`);
    doc.startViewTransition(() => flushSync(commit));
  }, []);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

const ORDER: ThemePref[] = ["light", "dark", "system"];
const LABEL: Record<ThemePref, string> = { light: "Tema claro", dark: "Tema escuro", system: "Tema do sistema" };

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme: current, setTheme } = useTheme();
  // Até montar, renderiza igual ao servidor ("system") para não divergir na hidratação
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme: ThemePref = mounted ? current : "system";
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      aria-label={`${LABEL[theme]} — mudar para ${LABEL[next].toLowerCase()}`}
      title={LABEL[theme]}
      className={`group rounded-md p-2.5 hover:bg-stone2 ${className}`}
      data-testid="theme-toggle"
    >
      <Icon className="size-5 transition-transform duration-500 group-hover:rotate-[20deg]" />
    </button>
  );
}
