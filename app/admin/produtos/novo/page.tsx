import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Novo produto" };

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-black uppercase">Novo produto</h1>
      <ProductForm
        categories={categories}
        initial={{ id: null, name: "", slug: "", description: "", details: [], priceCents: 0, compareAtCents: null, categoryId: categories[0]?.id ?? "", stock: 0, sizes: [], colors: [], badge: null, active: true, featured: false, images: [] }}
      />
    </div>
  );
}
