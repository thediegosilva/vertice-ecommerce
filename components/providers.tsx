"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster, toast } from "sonner";
import { ThemeProvider, useTheme } from "./theme";
import { addToCartAction, getCartAction, updateCartItemAction } from "@/actions/cart";
import { getWishlistIdsAction, syncWishlistAction, toggleWishlistAction } from "@/actions/wishlist";
import type { CartView } from "@/lib/cart";
import { flyToCart } from "@/lib/effects";

// ---------------- Carrinho ----------------

type AddInput = { productId: string; quantity: number; size?: string; color?: string };
type Fly = { src: string; from: DOMRect };

type CartCtx = {
  cart: CartView | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  pending: boolean;
  add: (input: AddInput, fly?: Fly) => Promise<boolean>;
  update: (itemId: string, quantity: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fora do provider");
  return ctx;
}

function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    setCart(await getCartAction());
  }, []);

  useEffect(() => {
    refresh().catch(() => setCart(null));
  }, [refresh]);

  const add = useCallback(async (input: AddInput, fly?: Fly) => {
    const res = await addToCartAction({ size: "", color: "", ...input });
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    startTransition(() => setCart(res.data));
    const canFly = fly && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (canFly) {
      // A miniatura voa até o ícone do carrinho; o drawer abre quando ela "pousa"
      flyToCart(fly.src, fly.from);
      setTimeout(() => setOpen(true), 700);
    } else setOpen(true);
    return true;
  }, []);

  const update = useCallback(async (itemId: string, quantity: number) => {
    const res = await updateCartItemAction({ itemId, quantity });
    if (!res.ok) toast.error(res.error);
    else startTransition(() => setCart(res.data));
  }, []);

  const value = useMemo(() => ({ cart, open, setOpen, pending, add, update, refresh }), [cart, open, pending, add, update, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------- Favoritos ----------------

const WISHLIST_KEY = "vertice:wishlist";

type WishCtx = { ids: Set<string>; toggle: (productId: string) => Promise<void>; has: (id: string) => boolean };
const WishlistContext = createContext<WishCtx | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist fora do provider");
  return ctx;
}

function readLocal(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string" && /^[a-z0-9]{10,40}$/i.test(x)).slice(0, 100) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    /* storage indisponível */
  }
}

function WishlistProvider({ children, isLoggedIn }: { children: React.ReactNode; isLoggedIn: boolean }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const synced = useRef(false);

  useEffect(() => {
    const local = readLocal();
    if (!isLoggedIn) {
      setIds(new Set(local));
      synced.current = false;
      return;
    }
    if (synced.current) return;
    synced.current = true;
    (async () => {
      // Logado: envia favoritos do localStorage ao banco e limpa o local
      if (local.length) {
        const res = await syncWishlistAction(local);
        if (res.ok) {
          writeLocal([]);
          setIds(new Set(res.data));
          return;
        }
      }
      setIds(new Set(await getWishlistIdsAction()));
    })().catch(() => {});
  }, [isLoggedIn]);

  const toggle = useCallback(
    async (productId: string) => {
      const wasSaved = ids.has(productId);
      const next = new Set(ids);
      if (wasSaved) next.delete(productId);
      else next.add(productId);
      setIds(next);
      if (!isLoggedIn) {
        writeLocal([...next]);
        toast.success(wasSaved ? "Removido dos favoritos" : "Salvo nos favoritos");
        return;
      }
      const res = await toggleWishlistAction(productId);
      if (!res.ok) {
        toast.error(res.error);
        setIds(ids);
      } else toast.success(res.data.saved ? "Salvo nos favoritos" : "Removido dos favoritos");
    },
    [ids, isLoggedIn],
  );

  const value = useMemo(() => ({ ids, toggle, has: (id: string) => ids.has(id) }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster theme={resolved} position="bottom-center" toastOptions={{ classNames: { toast: "!rounded-md !font-sans" } }} />;
}

export function Providers({ children, isLoggedIn }: { children: React.ReactNode; isLoggedIn: boolean }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <CartProvider>
          <WishlistProvider isLoggedIn={isLoggedIn}>
            {children}
            <ThemedToaster />
          </WishlistProvider>
        </CartProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
