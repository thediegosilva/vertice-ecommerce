"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, confirmTwoFactor, disableTwoFactor, startTwoFactorSetup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await changePasswordAction({
            currentPassword: hasPassword ? String(fd.get("currentPassword") ?? "") : undefined,
            newPassword: String(fd.get("newPassword") ?? ""),
            confirmPassword: String(fd.get("confirmPassword") ?? ""),
          });
          if (res && !res.ok) setError(res.error);
        });
      }}
      className="grid max-w-xl gap-4 rounded-md bg-card p-6"
    >
      {!hasPassword && <p className="text-sm text-muted-foreground">Sua conta usa login com Google. Defina uma senha para também entrar com email.</p>}
      {hasPassword && (
        <div>
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} className="mt-1.5" />
        </div>
      )}
      <div>
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required maxLength={128} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} className="mt-1.5" />
      </div>
      <FieldError>{error}</FieldError>
      <p className="text-xs text-muted-foreground">Ao trocar a senha, todas as sessões serão encerradas.</p>
      <Button type="submit" disabled={pending} className="w-fit">{pending ? "Salvando…" : "Alterar senha"}</Button>
    </form>
  );
}

export function TwoFactorPanel({ enabled: initial }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="max-w-xl rounded-md bg-card p-6">
      <p className="flex items-center gap-2 font-semibold">
        {enabled ? <ShieldCheck className="size-5 text-emerald-600" /> : <ShieldOff className="size-5 text-muted-foreground" />}
        Verificação em duas etapas (TOTP) {enabled ? "ativa" : "desativada"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Use Google Authenticator, 1Password, Authy ou similar. Recomendado para administradores.</p>

      {!enabled && !setup && (
        <Button
          className="mt-5"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await startTwoFactorSetup();
              if (res.ok) setSetup(res.data);
              else toast.error(res.error);
            })
          }
        >
          Ativar 2FA
        </Button>
      )}

      {setup && !enabled && (
        <div className="mt-5 space-y-4">
          <Image src={setup.qr} alt="QR code para configurar o app autenticador" width={200} height={200} unoptimized className="rounded border" />
          <p className="text-xs text-muted-foreground">Ou digite a chave: <code className="break-all font-mono">{setup.secret}</code></p>
          <div>
            <Label htmlFor="totp-code">Código de 6 dígitos</Label>
            <Input id="totp-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} className="mt-1.5 max-w-40 text-center font-mono tracking-[0.4em]" />
          </div>
          <Button
            disabled={pending || code.length !== 6}
            onClick={() =>
              start(async () => {
                const res = await confirmTwoFactor({ code });
                if (res.ok) {
                  setEnabled(true);
                  setSetup(null);
                  setCode("");
                  toast.success("2FA ativado!");
                } else toast.error(res.error);
              })
            }
          >
            Confirmar
          </Button>
        </div>
      )}

      {enabled && (
        <div className="mt-5 flex items-end gap-3">
          <div>
            <Label htmlFor="totp-off">Código para desativar</Label>
            <Input id="totp-off" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} className="mt-1.5 max-w-40 text-center font-mono tracking-[0.4em]" />
          </div>
          <Button
            variant="outline"
            disabled={pending || code.length !== 6}
            onClick={() =>
              start(async () => {
                const res = await disableTwoFactor({ code });
                if (res.ok) {
                  setEnabled(false);
                  setCode("");
                  toast.success("2FA desativado");
                } else toast.error(res.error);
              })
            }
          >
            Desativar
          </Button>
        </div>
      )}
    </div>
  );
}
