import { z } from "zod";

/**
 * Schemas Zod compartilhados entre frontend e backend.
 * Todos os objetos são "strict": campos fora do schema são rejeitados.
 */

const trimmed = (min: number, max: number, msg?: string) =>
  z.string().trim().min(min, { error: msg ?? `Mínimo de ${min} caracteres` }).max(max, { error: `Máximo de ${max} caracteres` });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Email inválido" }));

export const passwordSchema = z
  .string()
  .min(8, { error: "A senha deve ter ao menos 8 caracteres" })
  .max(128, { error: "Senha muito longa" })
  .regex(/[a-z]/, { error: "Inclua uma letra minúscula" })
  .regex(/[A-Z]/, { error: "Inclua uma letra maiúscula" })
  .regex(/\d/, { error: "Inclua um número" });

export const cuidSchema = z.string().min(10).max(40).regex(/^[a-z0-9]+$/i, { error: "ID inválido" });
export const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);

export const registerSchema = z
  .strictObject({
    name: trimmed(2, 80, "Informe seu nome"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "As senhas não conferem", path: ["confirmPassword"] });

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe a senha" }).max(128),
  totp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: "Código de 6 dígitos" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  callbackUrl: z.string().max(200).optional(),
});

export const forgotPasswordSchema = z.strictObject({ email: emailSchema });

export const resetPasswordSchema = z
  .strictObject({
    token: z.string().min(20).max(100).regex(/^[A-Za-z0-9_-]+$/),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "As senhas não conferem", path: ["confirmPassword"] });

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string().max(128).optional(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { error: "As senhas não conferem", path: ["confirmPassword"] });

export const profileSchema = z.strictObject({
  name: trimmed(2, 80),
  phone: z
    .string()
    .trim()
    .regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, { error: "Telefone inválido" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const UF = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const addressSchema = z.strictObject({
  label: trimmed(1, 30).default("Casa"),
  recipient: trimmed(2, 80, "Informe o destinatário"),
  zip: z.string().trim().regex(/^\d{5}-?\d{3}$/, { error: "CEP inválido" }).transform((v) => v.replace(/\D/g, "")),
  street: trimmed(2, 120, "Informe a rua"),
  number: trimmed(1, 10, "Informe o número"),
  complement: z.string().trim().max(60).optional().or(z.literal("").transform(() => undefined)),
  district: trimmed(2, 60, "Informe o bairro"),
  city: trimmed(2, 60, "Informe a cidade"),
  state: z.enum(UF, { error: "UF inválida" }),
  phone: z.string().trim().max(20).optional().or(z.literal("").transform(() => undefined)),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const couponCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3)
  .max(30)
  .regex(/^[A-Z0-9_-]+$/, { error: "Cupom inválido" });

export const cartAddSchema = z.strictObject({
  productId: cuidSchema,
  quantity: z.number().int().min(1).max(10),
  size: z.string().max(10).default(""),
  color: z.string().max(30).default(""),
});

export const cartUpdateSchema = z.strictObject({
  itemId: cuidSchema,
  quantity: z.number().int().min(0).max(10),
});

export const shippingMethodSchema = z.enum(["STANDARD", "EXPRESS"]);

export const checkoutSchema = z.strictObject({
  address: addressSchema.omit({ label: true, isDefault: true }),
  saveAddress: z.boolean().default(false),
  shippingMethod: shippingMethodSchema,
  couponCode: couponCodeSchema.optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reviewSchema = z.strictObject({
  productId: cuidSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  comment: trimmed(10, 1000, "Conte um pouco mais (mín. 10 caracteres)"),
});

export const newsletterSchema = z.strictObject({ email: emailSchema });

export const SORT_OPTIONS = ["relevance", "price-asc", "price-desc", "rating", "newest"] as const;

export const shopQuerySchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().max(40).regex(/^[a-z0-9-]*$/).optional().catch(undefined),
  min: z.coerce.number().int().min(0).max(1_000_000).optional().catch(undefined),
  max: z.coerce.number().int().min(0).max(1_000_000).optional().catch(undefined),
  rating: z.coerce.number().min(0).max(5).optional().catch(undefined),
  sort: z.enum(SORT_OPTIONS).optional().catch(undefined),
});
export type ShopQuery = z.infer<typeof shopQuerySchema>;

// ---------- Admin ----------

export const productSchema = z.strictObject({
  name: trimmed(2, 120),
  slug: slugSchema.optional().or(z.literal("").transform(() => undefined)),
  description: trimmed(10, 5000),
  details: z.array(trimmed(1, 200)).max(20).default([]),
  priceCents: z.number().int().min(1).max(100_000_000),
  compareAtCents: z.number().int().min(1).max(100_000_000).nullable().optional(),
  categoryId: cuidSchema,
  stock: z.number().int().min(0).max(1_000_000),
  sizes: z.array(z.string().trim().min(1).max(10)).max(20).default([]),
  colors: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
  badge: z.string().trim().max(20).nullable().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z
    .array(
      z.strictObject({
        url: z.url({ protocol: /^https$/, hostname: /^(images\.unsplash\.com|res\.cloudinary\.com)$/, error: "URL de imagem não permitida" }),
        alt: trimmed(1, 120),
      }),
    )
    .min(1, { error: "Adicione ao menos uma imagem" })
    .max(10),
});
export type ProductInput = z.infer<typeof productSchema>;

export const couponSchema = z.strictObject({
  code: couponCodeSchema,
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(1).max(10_000_000),
  minSubtotalCents: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
}).refine((c) => c.type !== "PERCENT" || c.value <= 100, { error: "Percentual máximo é 100", path: ["value"] });

export const orderStatusSchema = z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]);

export const totpCodeSchema = z.strictObject({ code: z.string().trim().regex(/^\d{6}$/, { error: "Código de 6 dígitos" }) });

export function firstError(err: z.ZodError) {
  return err.issues[0]?.message ?? "Dados inválidos";
}
