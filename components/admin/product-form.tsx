"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { saveProductAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Initial = {
  id: string | null; name: string; slug: string; description: string; details: string[]; priceCents: number; compareAtCents: number | null;
  categoryId: string; stock: number; sizes: string[]; colors: string[]; badge: string | null; active: boolean; featured: boolean; images: { url: string; alt: string }[];
};

const toReais = (c: number | null) => (c ? (c / 100).toFixed(2) : "");
const toCents = (v: string) => Math.round(Number(v.replace(",", ".")) * 100);
const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

export function ProductForm({ initial, categories }: { initial: Initial; categories: { id: string; name: string }[] }) {
  const [f, setF] = useState({
    ...initial,
    price: toReais(initial.priceCents),
    compareAt: toReais(initial.compareAtCents),
    sizesText: initial.sizes.join(", "),
    colorsText: initial.colors.join(", "),
    detailsText: initial.details.join("\n"),
  });
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Arquivo maior que 5MB");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !d.url) throw new Error(d.error ?? "Falha no upload");
      set("images", [...f.images, { url: d.url, alt: f.name || "Foto do produto" }]);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function move(i: number, d: -1 | 1) {
    const imgs = [...f.images];
    const j = i + d;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set("images", imgs);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveProductAction(initial.id, {
        name: f.name,
        slug: f.slug,
        description: f.description,
        details: f.detailsText.split("\n").map((s) => s.trim()).filter(Boolean),
        priceCents: toCents(f.price),
        compareAtCents: f.compareAt ? toCents(f.compareAt) : null,
        categoryId: f.categoryId,
        stock: Number(f.stock),
        sizes: list(f.sizesText),
        colors: list(f.colorsText),
        badge: f.badge || null,
        active: f.active,
        featured: f.featured,
        images: f.images,
      });
      if (res.ok) {
        toast.success("Produto salvo");
        router.push("/admin/produtos");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5 rounded-md bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="name">Nome</Label><Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} className="mt-1.5" /></div>
          <div><Label htmlFor="slug">Slug (opcional)</Label><Input id="slug" value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} pattern="[a-z0-9-]*" maxLength={120} className="mt-1.5" /></div>
        </div>
        <div><Label htmlFor="desc">Descrição</Label><Textarea id="desc" value={f.description} onChange={(e) => set("description", e.target.value)} required maxLength={5000} rows={5} className="mt-1.5" /></div>
        <div><Label htmlFor="details">Detalhes (um por linha)</Label><Textarea id="details" value={f.detailsText} onChange={(e) => set("detailsText", e.target.value)} rows={4} className="mt-1.5" /></div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div><Label htmlFor="price">Preço (R$)</Label><Input id="price" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} required className="mt-1.5" /></div>
          <div><Label htmlFor="compare">Preço antigo (R$)</Label><Input id="compare" inputMode="decimal" value={f.compareAt} onChange={(e) => set("compareAt", e.target.value)} className="mt-1.5" /></div>
          <div><Label htmlFor="stock">Estoque</Label><Input id="stock" type="number" min={0} value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} required className="mt-1.5" /></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="sizes">Tamanhos (separados por vírgula)</Label><Input id="sizes" value={f.sizesText} onChange={(e) => set("sizesText", e.target.value)} placeholder="P, M, G" className="mt-1.5" /></div>
          <div><Label htmlFor="colors">Cores (separadas por vírgula)</Label><Input id="colors" value={f.colorsText} onChange={(e) => set("colorsText", e.target.value)} placeholder="Preto, Branco" className="mt-1.5" /></div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-4 rounded-md bg-card p-6">
          <div>
            <Label htmlFor="cat">Categoria</Label>
            <NativeSelect id="cat" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="mt-1.5">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </div>
          <div><Label htmlFor="badge">Badge</Label><Input id="badge" value={f.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="Novo, Oferta…" maxLength={20} className="mt-1.5" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-flame" /> Ativo na loja</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-flame" /> Destaque na home</label>
        </div>
        <div className="space-y-4 rounded-md bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider">Imagens</p>
          <ul className="space-y-2">
            {f.images.map((img, i) => (
              <li key={img.url + i} className="flex items-center gap-2">
                <div className="relative size-14 shrink-0 overflow-hidden rounded bg-stone2"><Image src={img.url} alt="" fill sizes="56px" className="object-cover" /></div>
                <Input value={img.alt} aria-label="Texto alternativo" onChange={(e) => set("images", f.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} className="h-9 text-xs" />
                <button type="button" aria-label="Subir" onClick={() => move(i, -1)} className="p-1"><ArrowUp className="size-4" /></button>
                <button type="button" aria-label="Descer" onClick={() => move(i, 1)} className="p-1"><ArrowDown className="size-4" /></button>
                <button type="button" aria-label="Remover imagem" onClick={() => set("images", f.images.filter((_, j) => j !== i))} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://images.unsplash.com/…" className="h-9 text-xs" aria-label="URL da imagem" />
            <Button type="button" size="sm" variant="outline" onClick={() => { if (newUrl) { set("images", [...f.images, { url: newUrl, alt: f.name || "Foto do produto" }]); setNewUrl(""); } }}><ImagePlus /></Button>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button type="button" variant="secondary" size="sm" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload /> {uploading ? "Enviando…" : "Enviar arquivo (máx. 5MB)"}
          </Button>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar produto"}</Button>
      </div>
    </form>
  );
}
