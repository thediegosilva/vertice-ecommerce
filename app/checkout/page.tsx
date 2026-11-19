import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findCart, toCartView } from "@/lib/cart";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { CancelPending } from "@/components/checkout/cancel-pending";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelado?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/checkout");
  const { cancelado } = await searchParams;

  const [cart, addresses, user, cancelledOrder] = await Promise.all([
    findCart(session.user.id),
    db.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    typeof cancelado === "string" && cancelado.length < 40
      ? db.order.findFirst({ where: { number: cancelado, userId: session.user.id, status: "PENDING" }, select: { id: true, number: true } })
      : null,
  ]);
  const view = toCartView(cart);

  return (
    <div className="container py-10 md:py-14">
      <h1 className="mb-8 font-display text-4xl font-black uppercase md:text-5xl">Checkout</h1>
      {cancelledOrder && <CancelPending orderId={cancelledOrder.id} number={cancelledOrder.number} />}
      {view.items.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed py-20 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" />
          <p className="mt-4 font-display text-xl font-bold">Seu carrinho está vazio</p>
          <Button asChild className="mt-6"><Link href="/shop">Ver coleção</Link></Button>
        </div>
      ) : (
        <CheckoutFlow
          cart={view}
          userName={user?.name ?? ""}
          addresses={addresses.map((a) => ({ id: a.id, label: a.label, recipient: a.recipient, zip: a.zip, street: a.street, number: a.number, complement: a.complement, district: a.district, city: a.city, state: a.state, phone: a.phone, isDefault: a.isDefault }))}
        />
      )}
    </div>
  );
}
