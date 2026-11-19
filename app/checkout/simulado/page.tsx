import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { mockPaymentsEnabled } from "@/lib/stripe";
import { MockPay } from "@/components/checkout/mock-pay";

export const metadata: Metadata = { title: "Pagamento (simulado)", robots: { index: false } };

export default async function MockPaymentPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  if (!mockPaymentsEnabled) notFound();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { pedido } = await searchParams;
  if (typeof pedido !== "string" || pedido.length > 40) notFound();
  const order = await db.order.findFirst({ where: { number: pedido, userId: session.user.id } });
  if (!order) notFound();
  if (order.status !== "PENDING") redirect(`/checkout/sucesso?pedido=${order.number}`);
  return <MockPay orderId={order.id} number={order.number} totalCents={order.totalCents} />;
}
