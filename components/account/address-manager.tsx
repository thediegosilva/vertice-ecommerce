"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddressAction, saveAddressAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { UF } from "@/lib/validators";

type Address = { id: string; label: string; recipient: string; zip: string; street: string; number: string; complement: string | null; district: string; city: string; state: string; phone: string | null; isDefault: boolean };
const blank = { label: "Casa", recipient: "", zip: "", street: "", number: "", complement: "", district: "", city: "", state: "SP", phone: "", isDefault: false };

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<{ id: string | null; data: typeof blank } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const save = () =>
    start(async () => {
      if (!editing) return;
      const res = await saveAddressAction(editing.id, editing.data);
      if (res.ok) {
        toast.success("Endereço salvo");
        setEditing(null);
        router.refresh();
      } else toast.error(res.error);
    });

  const set = (k: keyof typeof blank, v: string | boolean) => setEditing((e) => (e ? { ...e, data: { ...e.data, [k]: v } } : e));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-md bg-card p-5 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 font-bold"><MapPin className="size-4 text-flame" /> {a.label} {a.isDefault && <span className="text-xs font-normal text-muted-foreground">(padrão)</span>}</p>
              <div className="flex gap-1">
                <button aria-label="Editar endereço" className="rounded p-1.5 hover:bg-stone2" onClick={() => setEditing({ id: a.id, data: { ...a, complement: a.complement ?? "", phone: a.phone ?? "" } })}><Pencil className="size-4" /></button>
                <button
                  aria-label="Excluir endereço"
                  className="rounded p-1.5 hover:bg-stone2 hover:text-destructive"
                  onClick={() => {
                    if (!confirm("Excluir este endereço?")) return;
                    start(async () => {
                      const res = await deleteAddressAction(a.id);
                      if (res.ok) router.refresh();
                      else toast.error(res.error);
                    });
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="text-muted-foreground">{a.recipient}<br />{a.street}, {a.number}{a.complement && ` — ${a.complement}`}<br />{a.district}, {a.city}/{a.state} · {a.zip.replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
          </div>
        ))}
        <button onClick={() => setEditing({ id: null, data: blank })} className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-sm font-semibold hover:border-ink">
          <Plus className="size-5" /> Adicionar endereço
        </button>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl p-6" aria-describedby={undefined}>
          <DialogTitle className="mb-5 font-display text-xl font-extrabold uppercase">{editing?.id ? "Editar endereço" : "Novo endereço"}</DialogTitle>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-4 sm:grid-cols-6">
              {([
                ["label", "Apelido", "sm:col-span-2"], ["recipient", "Destinatário", "sm:col-span-4"], ["zip", "CEP", "sm:col-span-2"], ["street", "Rua", "sm:col-span-4"],
                ["number", "Número", "sm:col-span-2"], ["complement", "Complemento", "sm:col-span-4"], ["district", "Bairro", "sm:col-span-3"], ["city", "Cidade", "sm:col-span-3"], ["phone", "Telefone", "sm:col-span-4"],
              ] as const).map(([k, l, c]) => (
                <div key={k} className={c}>
                  <Label htmlFor={`a-${k}`}>{l}</Label>
                  <Input id={`a-${k}`} value={editing.data[k] as string} maxLength={120} onChange={(e) => set(k, e.target.value)} className="mt-1.5" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Label htmlFor="a-state">UF</Label>
                <NativeSelect id="a-state" value={editing.data.state} onChange={(e) => set("state", e.target.value)} className="mt-1.5">
                  {UF.map((u) => <option key={u}>{u}</option>)}
                </NativeSelect>
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-6">
                <input type="checkbox" checked={editing.data.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="size-4 accent-flame" /> Usar como padrão
              </label>
              <Button type="submit" disabled={pending} className="sm:col-span-6">{pending ? "Salvando…" : "Salvar endereço"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
