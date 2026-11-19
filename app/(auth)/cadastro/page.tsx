import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default async function RegisterPage() {
  if ((await auth())?.user) redirect("/conta");
  return (
    <>
      <h1 className="font-display text-4xl font-black uppercase">Criar conta</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Ganhe 10% OFF na primeira compra com o cupom VERTICE10.</p>
      {googleEnabled && (
        <>
          <GoogleButton />
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-stone2" />ou<span className="h-px flex-1 bg-stone2" /></div>
        </>
      )}
      <RegisterForm />
      <p className="mt-8 text-center text-sm">
        Já tem conta? <Link href="/login" className="font-bold underline underline-offset-4">Entrar</Link>
      </p>
    </>
  );
}
