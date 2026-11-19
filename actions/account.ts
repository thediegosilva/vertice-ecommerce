"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guard";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { enforceRateLimit } from "@/lib/rate-limit";
import { addressSchema, cuidSchema, profileSchema } from "@/lib/validators";

export async function updateProfileAction(input: unknown): Promise<ActionResult<null>> {
  return runAction("profile", async () => {
    const user = await requireUser();
    await enforceRateLimit("write");
    const data = profileSchema.parse(input);
    await db.user.update({ where: { id: user.id }, data: { name: data.name, phone: data.phone ?? null } });
    revalidatePath("/conta");
    return null;
  });
}

export async function saveAddressAction(id: string | null, input: unknown): Promise<ActionResult<null>> {
  return runAction("address_save", async () => {
    const user = await requireUser();
    await enforceRateLimit("write");
    const data = addressSchema.parse(input);
    await db.$transaction(async (tx) => {
      if (data.isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      if (id) {
        cuidSchema.parse(id);
        // Anti-IDOR: o filtro inclui userId da SESSÃO
        const res = await tx.address.updateMany({ where: { id, userId: user.id }, data: { ...data, isDefault: data.isDefault ?? false } });
        if (res.count !== 1) throw new UserError("Endereço não encontrado.");
      } else {
        const count = await tx.address.count({ where: { userId: user.id } });
        if (count >= 10) throw new UserError("Limite de 10 endereços.");
        await tx.address.create({ data: { ...data, isDefault: data.isDefault ?? count === 0, userId: user.id } });
      }
    });
    revalidatePath("/conta/enderecos");
    return null;
  });
}

export async function deleteAddressAction(id: string): Promise<ActionResult<null>> {
  return runAction("address_delete", async () => {
    const user = await requireUser();
    cuidSchema.parse(id);
    const res = await db.address.deleteMany({ where: { id, userId: user.id } });
    if (res.count !== 1) throw new UserError("Endereço não encontrado.");
    revalidatePath("/conta/enderecos");
    return null;
  });
}
