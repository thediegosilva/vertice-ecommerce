"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (sent)
    return (
      <div className="rounded-md border bg-card p-6 text-center">
        <MailCheck className="mx-auto size-10 text-flame" />
        <p className="mt-4 font-semibold">Verifique seu email</p>
        <p className="mt-2 text-sm text-muted-foreground">Se houver uma conta com esse email, você receberá um link válido por 1 hora.</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-bold underline">Voltar ao login</Link>
      </div>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email") ?? "");
        start(async () => {
          const res = await forgotPasswordAction({ email });
          if (res.ok) setSent(true);
          else setError(res.error);
        });
      }}
      className="space-y-5"
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" maxLength={254} className="mt-1.5" />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Enviando…" : "Enviar link"}</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await resetPasswordAction({ token, password: String(fd.get("password") ?? ""), confirmPassword: String(fd.get("confirmPassword") ?? "") });
          if (res.ok) router.push("/login?reset=1");
          else setError(res.error);
        });
      }}
      className="space-y-5"
    >
      <div>
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" maxLength={128} className="mt-1.5" />
        <p className="mt-1 text-xs text-muted-foreground">Mín. 8 caracteres, com maiúscula, minúscula e número.</p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" maxLength={128} className="mt-1.5" />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Redefinir senha"}</Button>
    </form>
  );
}
