import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";
import { computeTotals, type ShippingMethodKey } from "./pricing";

export const GUEST_CART_COOKIE = "vertice_cart";
const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: {
        select: {
          id: true, slug: true, name: true, priceCents: true, compareAtCents: true, stock: true, active: true, deletedAt: true,
          images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  },
};

async function readGuestToken() {
  const c = await cookies();
  const raw = c.get(GUEST_CART_COOKIE)?.value;
  return raw && /^[A-Za-z0-9_-]{20,100}$/.test(raw) ? raw : null;
}

/** Busca o carrinho do usuário logado ou do visitante (cookie httpOnly). */
export async function findCart(userId: string | null | undefined) {
  if (userId) return db.cart.findUnique({ where: { userId }, include: cartInclude });
  const token = await readGuestToken();
  if (!token) return null;
  return db.cart.findUnique({ where: { guestToken: hashToken(token) }, include: cartInclude });
}

/** Busca ou cria (só pode ser chamado em Server Action / Route Handler — escreve cookie). */
export async function getOrCreateCart(userId: string | null | undefined) {
  if (userId) {
    return db.cart.upsert({ where: { userId }, update: {}, create: { userId }, include: cartInclude });
  }
  const existing = await findCart(null);
  if (existing) return existing;
  const token = generateToken(24);
  const cart = await db.cart.create({ data: { guestToken: hashToken(token) }, include: cartInclude });
  (await cookies()).set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_CART_MAX_AGE,
  });
  return cart;
}

/** Ao logar: move itens do carrinho de visitante para o carrinho do usuário. */
export async function mergeGuestCartOnLogin(userId: string) {
  let token: string | null = null;
  try {
    token = await readGuestToken();
  } catch {
    return; // fora de contexto de request
  }
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { guestToken: hashToken(token) }, include: { items: true } });
  if (guest && guest.items.length) {
    await db.$transaction(async (tx) => {
      const userCart = await tx.cart.upsert({ where: { userId }, update: {}, create: { userId } });
      for (const item of guest.items) {
        await tx.cartItem.upsert({
          where: { cartId_productId_size_color: { cartId: userCart.id, productId: item.productId, size: item.size, color: item.color } },
          update: { quantity: { increment: item.quantity } },
          create: { cartId: userCart.id, productId: item.productId, size: item.size, color: item.color, quantity: Math.min(item.quantity, 10) },
        });
      }
      await tx.cart.delete({ where: { id: guest.id } });
    });
  } else if (guest) {
    await db.cart.delete({ where: { id: guest.id } });
  }
  try {
    (await cookies()).delete(GUEST_CART_COOKIE);
  } catch {
    /* noop */
  }
}

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof findCart>>>;

export type CartView = {
  items: {
    id: string;
    productId: string;
    slug: string;
    name: string;
    image: string | null;
    size: string;
    color: string;
    quantity: number;
    unitPriceCents: number;
    compareAtCents: number | null;
    stock: number;
    available: boolean;
  }[];
  count: number;
  subtotalCents: number;
  missingForFreeShipping: number;
  shippingCents: number;
  totalCents: number;
};

/** Serializa o carrinho para o cliente — preços sempre do banco. */
export function toCartView(cart: CartWithItems | null, method: ShippingMethodKey = "STANDARD"): CartView {
  const items = (cart?.items ?? []).map((i) => ({
    id: i.id,
    productId: i.productId,
    slug: i.product.slug,
    name: i.product.name,
    image: i.product.images[0]?.url ?? null,
    size: i.size,
    color: i.color,
    quantity: i.quantity,
    unitPriceCents: i.product.priceCents,
    compareAtCents: i.product.compareAtCents,
    stock: i.product.stock,
    available: i.product.active && !i.product.deletedAt && i.product.stock >= i.quantity,
  }));
  const totals = computeTotals(
    items.filter((i) => i.available).map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    { method },
  );
  return {
    items,
    count: items.reduce((a, i) => a + i.quantity, 0),
    subtotalCents: totals.subtotalCents,
    missingForFreeShipping: totals.missingForFreeShipping,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
  };
}
