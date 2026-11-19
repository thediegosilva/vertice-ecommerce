import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "Este email já está cadastrado com senha. Entre com email e senha.",
  AccessDenied: "Acesso negado.",
  Configuration: "Erro de configuração de login.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string; changed?: string; reset?: string }> }) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : undefined;
  if ((await auth())?.user) redirect(callbackUrl ?? "/conta");
  return (
    <>
      <h1 className="font-display text-4xl font-black uppercase">Entrar</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Acesse seus pedidos, favoritos e endereços.</p>
      {sp.changed && <p className="mb-5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">Senha alterada. Entre novamente.</p>}
      {sp.reset && <p className="mb-5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">Senha redefinida com sucesso. Faça login.</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-md bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-300">{ERRORS[sp.error] ?? "Não foi possível entrar."}</p>}
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl} />
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground"><span className="h-px flex-1 bg-stone2" />ou<span className="h-px flex-1 bg-stone2" /></div>
        </>
      )}
      <LoginForm callbackUrl={callbackUrl} />
      <p className="mt-8 text-center text-sm">
        Novo por aqui? <Link href="/cadastro" className="font-bold underline underline-offset-4">Criar conta</Link>
      </p>
    </>
  );
}
