import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductRowActions, StockInput } from "@/components/admin/product-row";

export const metadata = { title: "Produtos" };

export default async function AdminProducts() {
  const products = await db.product.findMany({
    orderBy: [{ deletedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    include: { category: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" } } },
  });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-black uppercase">Produtos</h1>
        <Button asChild><Link href="/admin/produtos/novo"><Plus /> Novo produto</Link></Button>
      </div>
      <div className="overflow-x-auto rounded-md bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th className="p-4 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className={p.deletedAt ? "opacity-50" : ""}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 overflow-hidden rounded bg-stone2">{p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</div>
                    <div>
                      <Link href={`/admin/produtos/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                      <p className="text-xs text-muted-foreground">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td>{p.category.name}</td>
                <td>{formatBRL(p.priceCents)}{p.compareAtCents && <span className="block text-xs text-muted-foreground line-through">{formatBRL(p.compareAtCents)}</span>}</td>
                <td><StockInput id={p.id} stock={p.stock} disabled={!!p.deletedAt} /></td>
                <td>{p.deletedAt ? <Badge variant="muted">Excluído</Badge> : p.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="warning">Inativo</Badge>}</td>
                <td className="p-4 text-right"><ProductRowActions id={p.id} slug={p.slug} deleted={!!p.deletedAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
