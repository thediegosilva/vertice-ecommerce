import { describe, expect, it } from "vitest";
import { buildTracking, trackingCodeFor } from "@/lib/tracking";

describe("rastreio", () => {
  it("gera código no padrão VT#########BR", () => {
    expect(trackingCodeFor("VRT-261118-12345")).toMatch(/^VT\d{9}BR$/);
  });
  it("pedido pago e não enviado mostra etapas pendentes", () => {
    const now = new Date();
    const ev = buildTracking({ status: "PAID", createdAt: now, paidAt: now, shippedAt: null, deliveredAt: null, cancelledAt: null, shippingAddress: { city: "São Paulo", state: "SP" } });
    expect(ev[0].done && ev[1].done).toBe(true);
    expect(ev.at(-1)?.done).toBe(false);
  });
  it("pedido cancelado encerra a linha do tempo", () => {
    const now = new Date();
    const ev = buildTracking({ status: "CANCELLED", createdAt: now, paidAt: null, shippedAt: null, deliveredAt: null, cancelledAt: now, shippingAddress: {} });
    expect(ev.at(-1)?.title).toBe("Pedido cancelado");
  });
});
