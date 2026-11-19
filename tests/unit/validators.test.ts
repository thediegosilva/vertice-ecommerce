import { describe, expect, it } from "vitest";
import { addressSchema, cartAddSchema, couponCodeSchema, loginSchema, productSchema, registerSchema, shopQuerySchema } from "@/lib/validators";

describe("validators (Zod)", () => {
  it("exige senha forte no cadastro", () => {
    const base = { name: "Ana", email: "ana@x.com", confirmPassword: "" };
    expect(registerSchema.safeParse({ ...base, password: "123", confirmPassword: "123" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "semnumeroA", confirmPassword: "semnumeroA" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "Senha123", confirmPassword: "Senha124" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "Senha123", confirmPassword: "Senha123" }).success).toBe(true);
  });

  it("rejeita campos extras (strict) — ex.: tentativa de enviar role", () => {
    expect(registerSchema.safeParse({ name: "Ana", email: "a@x.com", password: "Senha123", confirmPassword: "Senha123", role: "ADMIN" }).success).toBe(false);
  });

  it("não aceita preço vindo do cliente no carrinho", () => {
    expect(cartAddSchema.safeParse({ productId: "clabcdefghij123", quantity: 1, priceCents: 1 }).success).toBe(false);
    expect(cartAddSchema.safeParse({ productId: "clabcdefghij123", quantity: 11 }).success).toBe(false);
    expect(cartAddSchema.safeParse({ productId: "'; DROP TABLE x;--", quantity: 1 }).success).toBe(false);
  });

  it("normaliza email e cupom", () => {
    expect(loginSchema.parse({ email: "  ANA@X.COM ", password: "x" }).email).toBe("ana@x.com");
    expect(couponCodeSchema.parse(" vertice10 ")).toBe("VERTICE10");
    expect(couponCodeSchema.safeParse("<script>").success).toBe(false);
  });

  it("valida CEP e UF", () => {
    const a = { recipient: "Ana", zip: "01310-100", street: "Av. Paulista", number: "1000", district: "Bela Vista", city: "São Paulo", state: "SP" };
    expect(addressSchema.parse(a).zip).toBe("01310100");
    expect(addressSchema.safeParse({ ...a, zip: "123" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...a, state: "XX" }).success).toBe(false);
  });

  it("ignora parâmetros de busca inválidos em vez de quebrar", () => {
    const q = shopQuerySchema.parse({ sort: "drop table", min: "abc", category: "../etc" });
    expect(q.sort).toBeUndefined();
    expect(q.min).toBeUndefined();
    expect(q.category).toBeUndefined();
  });

  it("só aceita imagens de hosts permitidos", () => {
    const p = { name: "Produto X", description: "Descrição longa", priceCents: 100, categoryId: "clabcdefghij123", stock: 1 };
    expect(productSchema.safeParse({ ...p, images: [{ url: "https://evil.com/a.jpg", alt: "a" }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, images: [{ url: "javascript:alert(1)", alt: "a" }] }).success).toBe(false);
    expect(productSchema.safeParse({ ...p, images: [{ url: "https://res.cloudinary.com/demo/a.jpg", alt: "a" }] }).success).toBe(true);
  });
});
