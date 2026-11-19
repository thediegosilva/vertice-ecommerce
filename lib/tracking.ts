/** Rastreio simulado e determinístico baseado nas datas reais do pedido. */
export type TrackingEvent = { date: Date; title: string; location: string; done: boolean };

export function trackingCodeFor(orderNumber: string) {
  const digits = orderNumber.replace(/\D/g, "").padStart(9, "0").slice(-9);
  return `VT${digits}BR`;
}

const HOUR = 3_600_000;

export function buildTracking(order: {
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  shippingAddress: unknown;
}): TrackingEvent[] {
  const addr = (order.shippingAddress ?? {}) as { city?: string; state?: string };
  const dest = addr.city ? `${addr.city} - ${addr.state ?? ""}` : "Destino";
  const events: TrackingEvent[] = [
    { date: order.createdAt, title: "Pedido recebido", location: "Loja VÉRTICE", done: true },
  ];
  if (order.status === "CANCELLED") {
    events.push({ date: order.cancelledAt ?? order.createdAt, title: "Pedido cancelado", location: "Loja VÉRTICE", done: true });
    return events;
  }
  events.push({ date: order.paidAt ?? order.createdAt, title: "Pagamento aprovado", location: "Stripe", done: !!order.paidAt });
  const shipped = order.shippedAt;
  events.push({ date: shipped ?? new Date(order.createdAt.getTime() + 24 * HOUR), title: "Pedido separado e embalado", location: "CD São Paulo - SP", done: !!shipped });
  events.push({ date: shipped ?? new Date(order.createdAt.getTime() + 30 * HOUR), title: "Objeto postado", location: "CD São Paulo - SP", done: !!shipped });
  const now = Date.now();
  if (shipped) {
    const transit = new Date(shipped.getTime() + 20 * HOUR);
    events.push({ date: transit, title: "Em trânsito para a unidade de destino", location: "Centro de distribuição", done: !!order.deliveredAt || transit.getTime() < now });
    const out = new Date(shipped.getTime() + 44 * HOUR);
    events.push({ date: out, title: "Saiu para entrega", location: dest, done: !!order.deliveredAt || out.getTime() < now });
  } else {
    events.push({ date: new Date(order.createdAt.getTime() + 72 * HOUR), title: "Saiu para entrega", location: dest, done: false });
  }
  events.push({ date: order.deliveredAt ?? new Date(order.createdAt.getTime() + 96 * HOUR), title: "Entregue", location: dest, done: !!order.deliveredAt });
  return events;
}
