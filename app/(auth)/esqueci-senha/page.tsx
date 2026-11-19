import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-black uppercase">Recuperar senha</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Informe seu email e enviaremos um link de redefinição.</p>
      <ForgotForm />
    </>
  );
}
