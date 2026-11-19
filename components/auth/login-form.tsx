"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [show, setShow] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await loginAction({
            email: String(fd.get("email") ?? ""),
            password: String(fd.get("password") ?? ""),
            totp: String(fd.get("totp") ?? ""),
            callbackUrl,
          });
          if (res.ok) {
            window.location.assign(res.data.redirectTo); // recarrega sessão, carrinho e favoritos
          } else if (res.error === "2FA_REQUIRED") {
            setNeeds2fa(true);
          } else setError(res.error);
        });
      }}
      className="space-y-5"
    >
      <div className={needs2fa ? "hidden" : "space-y-5"}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="mt-1.5" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/esqueci-senha" className="text-xs font-semibold underline-offset-4 hover:underline">Esqueci minha senha</Link>
          </div>
          <div className="relative mt-1.5">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required maxLength={128} className="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      {needs2fa && (
        <div className="rounded-md border bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-flame" /> Verificação em duas etapas</p>
          <Label htmlFor="totp">Código do app autenticador</Label>
          <Input id="totp" name="totp" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} autoFocus className="mt-1.5 text-center font-mono text-lg tracking-[0.5em]" />
        </div>
      )}
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Entrando…" : needs2fa ? "Verificar" : "Entrar"}
      </Button>
    </form>
  );
}
