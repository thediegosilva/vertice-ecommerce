import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageUser } from "@/lib/auth-guard";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = { title: "Endereços", robots: { index: false } };

export default async function AddressesPage() {
  const user = await pageUser();
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return (
    <section>
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase">Endereços</h2>
      <AddressManager addresses={addresses.map((a) => ({ id: a.id, label: a.label, recipient: a.recipient, zip: a.zip, street: a.street, number: a.number, complement: a.complement, district: a.district, city: a.city, state: a.state, phone: a.phone, isDefault: a.isDefault }))} />
    </section>
  );
}
