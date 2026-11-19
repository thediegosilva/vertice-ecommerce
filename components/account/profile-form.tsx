"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name, phone });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProfileAction(form);
          if (res.ok) toast.success("Perfil atualizado");
          else toast.error(res.error);
        });
      }}
      className="grid max-w-xl gap-5 rounded-md bg-card p-6"
    >
      <div>
        <Label htmlFor="p-name">Nome</Label>
        <Input id="p-name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="p-email">Email</Label>
        <Input id="p-email" value={email} disabled className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="p-phone">Telefone</Label>
        <Input id="p-phone" value={form.phone} placeholder="(11) 91234-5678" maxLength={20} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">{pending ? "Salvando…" : "Salvar alterações"}</Button>
    </form>
  );
}
