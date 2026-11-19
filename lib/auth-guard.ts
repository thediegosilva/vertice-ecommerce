import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "./db";

export class AuthError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
  }
}

/** Usuário autenticado ou erro. O id SEMPRE vem da sessão, nunca do cliente. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError("Faça login para continuar");
  return session.user;
}

/** Admin verificado no BANCO (não apenas no JWT) a cada chamada sensível. */
export async function requireAdmin() {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== "ADMIN") throw new AuthError("Acesso restrito");
  return user;
}

/** Checagem de posse (anti-IDOR): dono do recurso OU admin. */
export function canAccess(user: { id: string; role: string }, ownerId: string) {
  return user.id === ownerId || user.role === "ADMIN";
}

/** Para Server Components: redireciona ao login se não houver sessão. */
export async function pageUser(callbackUrl = "/conta") {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return session.user;
}
