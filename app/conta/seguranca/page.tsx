import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageUser } from "@/lib/auth-guard";
import { ChangePasswordForm, TwoFactorPanel } from "@/components/account/security-forms";

export const metadata: Metadata = { title: "Segurança", robots: { index: false } };

export default async function SecurityPage() {
  const sessionUser = await pageUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { passwordHash: true, twoFactorEnabled: true } });
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-display text-2xl font-extrabold uppercase">Senha</h2>
        <ChangePasswordForm hasPassword={!!user.passwordHash} />
      </section>
      <section>
        <h2 className="mb-4 font-display text-2xl font-extrabold uppercase">Autenticação em 2 fatores</h2>
        <TwoFactorPanel enabled={user.twoFactorEnabled} />
      </section>
    </div>
  );
}
