import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/conta");
  return (
    <div className="container py-10 md:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-flame">Minha conta</p>
      <h1 className="mb-10 mt-1 font-display text-4xl font-black uppercase md:text-5xl">Olá, {session.user.name?.split(" ")[0] ?? "cliente"}</h1>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <AccountNav isAdmin={session.user.role === "ADMIN"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
