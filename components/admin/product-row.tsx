"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction, restoreProductAction, updateStockAction } from "@/actions/admin";

export function StockInput({ id, stock, disabled }: { id: string; stock: number; disabled?: boolean }) {
  const [value, setValue] = useState(String(stock));
  const [pending, start] = useTransition();
  const save = () => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n === stock) return setValue(String(stock));
    start(async () => {
      const res = await updateStockAction(id, n);
      if (res.ok) toast.success("Estoque atualizado");
      else {
        toast.error(res.error);
        setValue(String(stock));
      }
    });
  };
  return (
    <input
      aria-label="Estoque"
      type="number"
      min={0}
      value={value}
      disabled={disabled || pending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={`h-9 w-20 rounded border px-2 ${Number(value) <= 10 ? "border-flame font-bold text-flame" : ""}`}
    />
  );
}

export function ProductRowActions({ id, slug, deleted }: { id: string; slug: string; deleted: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else toast.error(res.error ?? "Erro");
    });
  return (
    <div className="flex justify-end gap-1">
      {!deleted && <Link href={`/produto/${slug}`} target="_blank" aria-label="Ver na loja" className="rounded p-2 hover:bg-stone2"><ExternalLink className="size-4" /></Link>}
      <Link href={`/admin/produtos/${id}`} aria-label="Editar" className="rounded p-2 hover:bg-stone2"><Pencil className="size-4" /></Link>
      {deleted ? (
        <button disabled={pending} aria-label="Restaurar" onClick={() => run(() => restoreProductAction(id), "Produto restaurado")} className="rounded p-2 hover:bg-stone2"><RotateCcw className="size-4" /></button>
      ) : (
        <button disabled={pending} aria-label="Excluir" onClick={() => confirm("Excluir produto? (soft delete — pode ser restaurado)") && run(() => deleteProductAction(id), "Produto excluído")} className="rounded p-2 hover:bg-stone2 hover:text-destructive"><Trash2 className="size-4" /></button>
      )}
    </div>
  );
}
