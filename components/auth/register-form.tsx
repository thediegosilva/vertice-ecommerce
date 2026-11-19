"use client";

import { useState, useTransition } from "react";
import { registerAction } from "@/actions/auth";
import { registerSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

type Errors = Partial<Record<"name" | "email" | "password" | "confirmPassword" | "form", string>>;

export function RegisterForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, start] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          password: String(fd.get("password") ?? ""),
          confirmPassword: String(fd.get("confirmPassword") ?? ""),
        };
        // Validação Zod no cliente (UX) — o servidor valida de novo
        const parsed = registerSchema.safeParse(data);
        if (!parsed.success) {
          const errs: Errors = {};
          for (const issue of parsed.error.issues) {
            const k = issue.path[0] as keyof Errors;
            errs[k] ??= issue.message;
          }
          setErrors(errs);
          return;
        }
        setErrors({});
        start(async () => {
          const res = await registerAction(data);
          if (res.ok) window.location.assign(res.data.redirectTo);
          else setErrors({ form: res.error });
        });
      }}
      className="space-y-5"
    >
      {([
        ["name", "Nome completo", "text", "name"],
        ["email", "Email", "email", "email"],
        ["password", "Senha", "password", "new-password"],
        ["confirmPassword", "Confirmar senha", "password", "new-password"],
      ] as const).map(([name, label, type, ac]) => (
        <div key={name}>
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} type={type} autoComplete={ac} aria-invalid={!!errors[name]} maxLength={name === "email" ? 254 : 128} className="mt-1.5" />
          <FieldError>{errors[name]}</FieldError>
          {name === "password" && !errors.password && <p className="mt-1 text-xs text-muted-foreground">Mín. 8 caracteres, com maiúscula, minúscula e número.</p>}
        </div>
      ))}
      <FieldError>{errors.form}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Criando conta…" : "Criar conta"}</Button>
      <p className="text-center text-xs text-muted-foreground">Ao criar a conta você concorda com os Termos de Uso e a Política de Privacidade.</p>
    </form>
  );
}
