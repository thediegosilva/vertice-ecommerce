import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashPassword, verifyPassword } from "@/lib/password";
import { hashToken, generateToken, encrypt, decrypt } from "@/lib/crypto";
import { detectImageType, validateUpload } from "@/lib/upload";
import { maskEmail, redact } from "@/lib/logger";
import { escapeHtml } from "@/lib/email";

describe("senhas (Argon2id)", () => {
  it("gera hash argon2id e verifica", async () => {
    const h = await hashPassword("Senha123");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(h).not.toContain("Senha123");
    expect(await verifyPassword(h, "Senha123")).toBe(true);
    expect(await verifyPassword(h, "senha123")).toBe(false);
  });
});

describe("tokens", () => {
  it("token aleatório é salvo apenas como hash SHA-256", () => {
    const t = generateToken();
    expect(t.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(t)).not.toBe(t);
  });

  it("AES-256-GCM cifra e detecta adulteração", () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const c = encrypt("JBSWY3DPEHPK3PXP");
    expect(decrypt(c)).toBe("JBSWY3DPEHPK3PXP");
    const parts = c.split(".");
    parts[2] = Buffer.from("tampered").toString("base64url");
    expect(() => decrypt(parts.join("."))).toThrow();
  });
});

describe("upload", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  it("detecta tipo real pelos magic bytes", () => {
    expect(detectImageType(png)?.mime).toBe("image/png");
    expect(detectImageType(jpg)?.mime).toBe("image/jpeg");
  });
  it("rejeita SVG/HTML/executável mesmo com extensão de imagem", () => {
    const svg = new TextEncoder().encode('<svg onload="alert(1)"></svg>');
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0]);
    expect(validateUpload(svg, svg.length).ok).toBe(false);
    expect(validateUpload(exe, exe.length).ok).toBe(false);
  });
  it("rejeita arquivos > 5MB", () => {
    expect(validateUpload(png, 6 * 1024 * 1024).ok).toBe(false);
  });
});

describe("logs e escapes", () => {
  it("mascara email e remove segredos", () => {
    expect(maskEmail("joao.silva@gmail.com")).toBe("jo********@gmail.com");
    const r = redact({ password: "x", token: "y", nested: { email: "ana@x.com", card: "4242424242424242" }, msg: "cartão 4242 4242 4242 4242" }) as Record<string, unknown>;
    expect(r.password).toBe("[redacted]");
    expect(r.token).toBe("[redacted]");
    expect(JSON.stringify(r)).not.toContain("4242 4242");
    expect(JSON.stringify(r)).not.toContain("ana@x.com");
  });
  it("escapa HTML em emails", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});
