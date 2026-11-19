import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin VÉRTICE" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  // Role conferida no BANCO, não só no token
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true, twoFactorEnabled: true } });
  if (user?.role !== "ADMIN") notFound();
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <AdminNav />
      <div className="min-w-0">
        {!user.twoFactorEnabled && (
          <p className="mb-6 rounded-md bg-amber-50 dark:bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            Recomendado: ative a verificação em duas etapas em <a href="/conta/seguranca" className="font-semibold underline">Segurança</a>.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
