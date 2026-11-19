import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GuestWishlist } from "@/components/guest-wishlist";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default async function GuestWishlistPage() {
  if ((await auth())?.user) redirect("/conta/favoritos");
  return (
    <div className="container py-10 md:py-14">
      <h1 className="mb-2 font-display text-4xl font-black uppercase md:text-5xl">Favoritos</h1>
      <p className="mb-10 text-muted-foreground">Salvos neste navegador. Entre na sua conta para sincronizar entre dispositivos.</p>
      <GuestWishlist />
    </div>
  );
}
