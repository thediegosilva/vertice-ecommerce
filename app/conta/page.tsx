import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageUser } from "@/lib/auth-guard";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default async function AccountPage() {
  const sessionUser = await pageUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true, wishlist: true } } } });
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Pedidos", user._count.orders], ["Favoritos", user._count.wishlist], ["Cliente desde", user.createdAt.getFullYear()]].map(([l, v]) => (
          <div key={l as string} className="rounded-md bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-3xl font-black">{v}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-4 font-display text-2xl font-extrabold uppercase">Dados pessoais</h2>
        <ProfileForm name={user.name ?? ""} email={user.email} phone={user.phone ?? ""} />
      </section>
    </div>
  );
}
