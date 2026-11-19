"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findCart, getOrCreateCart, toCartView, type CartView } from "@/lib/cart";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cartAddSchema, cartUpdateSchema, cuidSchema } from "@/lib/validators";

async function currentUserId() {
  return (await auth())?.user?.id ?? null;
}

async function view(userId: string | null) {
  return toCartView(await findCart(userId));
}

export async function getCartAction(): Promise<CartView> {
  return view(await currentUserId());
}

export async function addToCartAction(input: unknown): Promise<ActionResult<CartView>> {
  return runAction("cart_add", async () => {
    await enforceRateLimit("write");
    const data = cartAddSchema.parse(input);
    const userId = await currentUserId();
    const product = await db.product.findFirst({
      where: { id: data.productId, active: true, deletedAt: null },
      select: { id: true, stock: true, sizes: true, colors: true },
    });
    if (!product) throw new UserError("Produto indisponível.");
    if (product.sizes.length && !product.sizes.includes(data.size)) throw new UserError("Selecione um tamanho.");
    if (!product.sizes.length) data.size = "";
    if (product.colors.length) {
      if (!data.color) data.color = product.colors[0];
      if (!product.colors.includes(data.color)) throw new UserError("Cor inválida.");
    } else data.color = "";

    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find((i) => i.productId === data.productId && i.size === data.size && i.color === data.color);
    const inCart = cart.items.filter((i) => i.productId === data.productId).reduce((a, i) => a + i.quantity, 0);
    if (inCart + data.quantity > product.stock) throw new UserError(product.stock === 0 ? "Produto esgotado." : `Apenas ${product.stock} em estoque.`);
    const newQty = Math.min((existing?.quantity ?? 0) + data.quantity, 10);

    await db.cartItem.upsert({
      where: { cartId_productId_size_color: { cartId: cart.id, productId: data.productId, size: data.size, color: data.color } },
      update: { quantity: newQty },
      create: { cartId: cart.id, productId: data.productId, size: data.size, color: data.color, quantity: newQty },
    });
    return view(userId);
  });
}

export async function updateCartItemAction(input: unknown): Promise<ActionResult<CartView>> {
  return runAction("cart_update", async () => {
    await enforceRateLimit("write");
    const { itemId, quantity } = cartUpdateSchema.parse(input);
    const userId = await currentUserId();
    const cart = await findCart(userId);
    // Anti-IDOR: o item precisa pertencer ao carrinho desta sessão
    const item = cart?.items.find((i) => i.id === itemId);
    if (!cart || !item) throw new UserError("Item não encontrado.");
    if (quantity === 0) {
      await db.cartItem.delete({ where: { id: item.id } });
    } else {
      if (quantity > item.product.stock) throw new UserError(`Apenas ${item.product.stock} em estoque.`);
      await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
    }
    return view(userId);
  });
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult<CartView>> {
  cuidSchema.parse(itemId);
  return updateCartItemAction({ itemId, quantity: 0 });
}
