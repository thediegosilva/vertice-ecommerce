import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Redefinir senha", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[A-Za-z0-9_-]{20,100}$/.test(token);
  return (
    <>
      <h1 className="font-display text-4xl font-black uppercase">Nova senha</h1>
      {valid ? (
        <>
          <p className="mb-8 mt-2 text-muted-foreground">Escolha uma senha forte que você não usa em outros sites.</p>
          <ResetForm token={token} />
        </>
      ) : (
        <p className="mt-4 text-muted-foreground">
          Link inválido. <Link href="/esqueci-senha" className="font-bold underline">Solicite um novo</Link>.
        </p>
      )}
    </>
  );
}
