import { describe, expect, it } from "vitest";
import { computeTotals, couponDiscount, shippingCost, validateCoupon, FREE_SHIPPING_THRESHOLD_CENTS, type CouponLike } from "@/lib/pricing";

const VERTICE10: CouponLike = { code: "VERTICE10", type: "PERCENT", value: 10, minSubtotalCents: 0, maxUses: null, usedCount: 0, expiresAt: null, active: true };

describe("pricing", () => {
  it("soma subtotal em centavos inteiros", () => {
    const t = computeTotals([{ unitPriceCents: 64_990, quantity: 2 }, { unitPriceCents: 18_990, quantity: 1 }]);
    expect(t.subtotalCents).toBe(148_970);
    expect(Number.isInteger(t.totalCents)).toBe(true);
  });

  it("frete grátis a partir de R$ 399 (padrão)", () => {
    expect(shippingCost(FREE_SHIPPING_THRESHOLD_CENTS, "STANDARD")).toBe(0);
    expect(shippingCost(FREE_SHIPPING_THRESHOLD_CENTS - 1, "STANDARD")).toBe(2_990);
    expect(shippingCost(FREE_SHIPPING_THRESHOLD_CENTS, "EXPRESS")).toBe(4_990);
    expect(shippingCost(0, "STANDARD")).toBe(0);
  });

  it("calcula quanto falta para frete grátis", () => {
    const t = computeTotals([{ unitPriceCents: 18_990, quantity: 1 }]);
    expect(t.missingForFreeShipping).toBe(39_900 - 18_990);
    expect(t.shippingCents).toBe(2_990);
  });

  it("VERTICE10 aplica 10% OFF", () => {
    const t = computeTotals([{ unitPriceCents: 64_990, quantity: 1 }], { coupon: VERTICE10 });
    expect(t.discountCents).toBe(6_499);
    expect(t.totalCents).toBe(64_990 - 6_499); // frete grátis
    expect(t.couponError).toBeNull();
  });

  it("rejeita cupom inativo, expirado, esgotado ou abaixo do mínimo", () => {
    expect(validateCoupon({ ...VERTICE10, active: false }, 10_000).ok).toBe(false);
    expect(validateCoupon({ ...VERTICE10, expiresAt: new Date(Date.now() - 1000) }, 10_000).ok).toBe(false);
    expect(validateCoupon({ ...VERTICE10, maxUses: 5, usedCount: 5 }, 10_000).ok).toBe(false);
    expect(validateCoupon({ ...VERTICE10, minSubtotalCents: 50_000 }, 10_000).ok).toBe(false);
    expect(validateCoupon(null, 10_000).ok).toBe(false);
  });

  it("desconto fixo nunca excede o subtotal", () => {
    expect(couponDiscount({ type: "FIXED", value: 99_999 }, 10_000)).toBe(10_000);
    expect(couponDiscount({ type: "PERCENT", value: 150 }, 10_000)).toBe(10_000);
  });

  it("rejeita preços/quantidades inválidos (não confia no input)", () => {
    expect(() => computeTotals([{ unitPriceCents: -1, quantity: 1 }])).toThrow();
    expect(() => computeTotals([{ unitPriceCents: 100.5, quantity: 1 }])).toThrow();
    expect(() => computeTotals([{ unitPriceCents: 100, quantity: 0 }])).toThrow();
  });
});
