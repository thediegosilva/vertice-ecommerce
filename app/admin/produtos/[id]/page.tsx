import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cuidSchema } from "@/lib/validators";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Editar produto" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!cuidSchema.safeParse(id).success) notFound();
  const [p, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } }),
    db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!p) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Editar: {p.name}</h1>
      <ProductForm
        categories={categories}
        initial={{ id: p.id, name: p.name, slug: p.slug, description: p.description, details: p.details, priceCents: p.priceCents, compareAtCents: p.compareAtCents, categoryId: p.categoryId, stock: p.stock, sizes: p.sizes, colors: p.colors, badge: p.badge, active: p.active, featured: p.featured, images: p.images.map((i) => ({ url: i.url, alt: i.alt })) }}
      />
    </div>
  );
}
