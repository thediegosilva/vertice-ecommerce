import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { ShopQuery } from "./validators";

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  priceCents: true,
  compareAtCents: true,
  rating: true,
  reviewCount: true,
  badge: true,
  stock: true,
  sizes: true,
  colors: true,
  description: true,
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

const visible = { active: true, deletedAt: null } satisfies Prisma.ProductWhereInput;

export async function getProducts(q: ShopQuery) {
  const where: Prisma.ProductWhereInput = { ...visible };
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { description: { contains: q.q, mode: "insensitive" } },
      { category: { name: { contains: q.q, mode: "insensitive" } } },
    ];
  }
  if (q.category) where.category = { slug: q.category };
  if (q.min !== undefined || q.max !== undefined) {
    where.priceCents = { ...(q.min !== undefined ? { gte: q.min * 100 } : {}), ...(q.max !== undefined ? { lte: q.max * 100 } : {}) };
  }
  if (q.rating) where.rating = { gte: q.rating };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    q.sort === "price-asc"
      ? [{ priceCents: "asc" }]
      : q.sort === "price-desc"
        ? [{ priceCents: "desc" }]
        : q.sort === "rating"
          ? [{ rating: "desc" }, { reviewCount: "desc" }]
          : q.sort === "newest"
            ? [{ createdAt: "desc" }]
            : [{ featured: "desc" }, { reviewCount: "desc" }, { rating: "desc" }];

  return db.product.findMany({ where, orderBy, select: productCardSelect, take: 60 });
}

export const getCategories = cache(() =>
  db.category.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { products: { where: visible } } } } }),
);

export const getFeatured = cache(() =>
  db.product.findMany({ where: { ...visible }, orderBy: [{ featured: "desc" }, { rating: "desc" }], select: productCardSelect, take: 8 }),
);

export const getProductBySlug = cache((slug: string) =>
  db.product.findFirst({
    where: { slug, ...visible },
    select: {
      ...productCardSelect,
      details: true,
      categoryId: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, rating: true, title: true, comment: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  }),
);

export function getRelated(productId: string, categoryId: string) {
  return db.product.findMany({
    where: { ...visible, id: { not: productId }, OR: [{ categoryId }, { featured: true }] },
    orderBy: [{ rating: "desc" }],
    select: productCardSelect,
    take: 4,
  });
}
