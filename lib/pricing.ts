/**
 * Regras de preço — funções PURAS, executadas SEMPRE no servidor
 * com dados vindos do banco. O cliente nunca envia valores.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 39_900; // R$ 399,00
export const SHIPPING_RATES_CENTS = { STANDARD: 2_990, EXPRESS: 4_990 } as const;
export type ShippingMethodKey = keyof typeof SHIPPING_RATES_CENTS;

export type CouponLike = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotalCents: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
};

export type CouponCheck = { ok: true } | { ok: false; reason: string };

export function validateCoupon(coupon: CouponLike | null, subtotalCents: number, now = new Date()): CouponCheck {
  if (!coupon || !coupon.active) return { ok: false, reason: "Cupom inválido." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, reason: "Cupom expirado." };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
    return { ok: false, reason: "Cupom esgotado." };
  if (subtotalCents < coupon.minSubtotalCents)
    return { ok: false, reason: `Pedido mínimo de R$ ${(coupon.minSubtotalCents / 100).toFixed(2).replace(".", ",")} para este cupom.` };
  return { ok: true };
}

export function couponDiscount(coupon: Pick<CouponLike, "type" | "value">, subtotalCents: number) {
  const raw =
    coupon.type === "PERCENT"
      ? Math.round((subtotalCents * Math.min(Math.max(coupon.value, 0), 100)) / 100)
      : Math.max(coupon.value, 0);
  return Math.min(raw, subtotalCents);
}

export function shippingCost(subtotalCents: number, method: ShippingMethodKey) {
  if (subtotalCents <= 0) return 0;
  if (method === "STANDARD" && subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return SHIPPING_RATES_CENTS[method];
}

export type LineInput = { unitPriceCents: number; quantity: number };

export function computeTotals(
  lines: LineInput[],
  opts: { coupon?: CouponLike | null; method?: ShippingMethodKey } = {},
) {
  for (const l of lines) {
    if (!Number.isInteger(l.unitPriceCents) || l.unitPriceCents < 0) throw new Error("Preço inválido");
    if (!Number.isInteger(l.quantity) || l.quantity < 1) throw new Error("Quantidade inválida");
  }
  const subtotalCents = lines.reduce((acc, l) => acc + l.unitPriceCents * l.quantity, 0);
  let discountCents = 0;
  let couponError: string | null = null;
  if (opts.coupon) {
    const check = validateCoupon(opts.coupon, subtotalCents);
    if (check.ok) discountCents = couponDiscount(opts.coupon, subtotalCents);
    else couponError = check.reason;
  }
  const method = opts.method ?? "STANDARD";
  // Frete grátis considera o subtotal (antes do desconto), como exibido na barra de progresso
  const shippingCents = shippingCost(subtotalCents, method);
  const totalCents = subtotalCents - discountCents + shippingCents;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  return { subtotalCents, discountCents, shippingCents, totalCents, missingForFreeShipping, couponError };
}
