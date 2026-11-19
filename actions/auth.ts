"use server";

import { AuthError as NextAuthError, CredentialsSignin } from "next-auth";
import QRCode from "qrcode";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth-guard";
import { sendPasswordReset, sendWelcome } from "@/lib/email";
import { createTotpSecret, openSecret, sealSecret, totpUri, verifyTotp } from "@/lib/totp";
import { logger } from "@/lib/logger";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  totpCodeSchema,
} from "@/lib/validators";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

function safeCallback(url?: string) {
  // Evita open redirect: apenas caminhos internos
  return url && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\") ? url : "/conta";
}

const LOGIN_ERRORS: Record<string, string> = {
  invalid: "Email ou senha incorretos.",
  locked: "Conta bloqueada temporariamente após várias tentativas. Tente novamente em 15 minutos.",
  "2fa_required": "2FA_REQUIRED",
  "2fa_invalid": "Código de verificação inválido.",
  rate_limited: "Muitas tentativas. Aguarde um minuto.",
};

export async function loginAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const { email, password, totp, callbackUrl } = parsed.data;
  try {
    await signIn("credentials", { email, password, totp: totp ?? "", redirect: false });
    return { ok: true, data: { redirectTo: safeCallback(callbackUrl) } };
  } catch (e) {
    if (e instanceof CredentialsSignin) return { ok: false, error: LOGIN_ERRORS[e.code] ?? LOGIN_ERRORS.invalid };
    if (e instanceof NextAuthError) return { ok: false, error: "Não foi possível entrar. Tente novamente." };
    throw e;
  }
}

export async function googleSignInAction(callbackUrl?: string) {
  await signIn("google", { redirectTo: safeCallback(callbackUrl) });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function registerAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const res = await runAction("register", async () => {
    await enforceRateLimit("sensitive", "register");
    const data = registerSchema.parse(input);
    const exists = await db.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (exists) throw new UserError("Este email já está cadastrado. Faça login ou recupere sua senha.");
    await db.user.create({ data: { name: data.name, email: data.email, passwordHash: await hashPassword(data.password) } });
    await sendWelcome(data.email, data.name).catch(() => {});
    return data;
  });
  if (!res.ok) return res;
  return loginAction({ email: res.data.email, password: res.data.password, callbackUrl: "/conta" });
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult<null>> {
  return runAction("forgot_password", async () => {
    const { email } = forgotPasswordSchema.parse(input);
    await enforceRateLimit("sensitive", `forgot:${email}`);
    const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
    if (user) {
      const token = generateToken(32);
      await db.$transaction([
        db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
        db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
      ]);
      await sendPasswordReset(email, token);
    } else {
      logger.info("auth.forgot_unknown_email", { email });
    }
    return null; // resposta sempre igual: não revela se o email existe
  });
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult<null>> {
  return runAction("reset_password", async () => {
    await enforceRateLimit("sensitive", "reset");
    const data = resetPasswordSchema.parse(input);
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(data.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) throw new UserError("Link inválido ou expirado. Solicite um novo.");
    const passwordHash = await hashPassword(data.password);
    await db.$transaction(async (tx) => {
      // Uso único garantido pela condição usedAt: null
      const used = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
      if (used.count !== 1) throw new UserError("Link inválido ou expirado. Solicite um novo.");
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, tokenVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } });
    });
    return null;
  });
}

export async function changePasswordAction(input: unknown): Promise<ActionResult<null>> {
  const res = await runAction("change_password", async () => {
    const sessionUser = await requireUser();
    await enforceRateLimit("sensitive", `change:${sessionUser.id}`);
    const data = changePasswordSchema.parse(input);
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
    if (user.passwordHash) {
      if (!data.currentPassword || !(await verifyPassword(user.passwordHash, data.currentPassword))) {
        throw new UserError("Senha atual incorreta.");
      }
    }
    // tokenVersion++ invalida todas as sessões existentes
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.newPassword), tokenVersion: { increment: 1 } } });
    return null;
  });
  if (res.ok) await signOut({ redirectTo: "/login?changed=1" });
  return res;
}

// ---------- 2FA (TOTP) ----------

export async function startTwoFactorSetup(): Promise<ActionResult<{ qr: string; secret: string }>> {
  return runAction("2fa_setup", async () => {
    const sessionUser = await requireUser();
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
    if (user.twoFactorEnabled) throw new UserError("2FA já está ativo.");
    const secret = createTotpSecret();
    await db.user.update({ where: { id: user.id }, data: { twoFactorSecret: sealSecret(secret) } });
    const qr = await QRCode.toDataURL(totpUri(user.email, secret), { margin: 1, width: 220 });
    return { qr, secret };
  });
}

export async function confirmTwoFactor(input: unknown): Promise<ActionResult<null>> {
  return runAction("2fa_enable", async () => {
    const sessionUser = await requireUser();
    await enforceRateLimit("login", `2fa:${sessionUser.id}`);
    const { code } = totpCodeSchema.parse(input);
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
    if (!user.twoFactorSecret) throw new UserError("Inicie a configuração novamente.");
    if (!verifyTotp(code, openSecret(user.twoFactorSecret))) throw new UserError("Código inválido.");
    await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    return null;
  });
}

export async function disableTwoFactor(input: unknown): Promise<ActionResult<null>> {
  return runAction("2fa_disable", async () => {
    const sessionUser = await requireUser();
    await enforceRateLimit("login", `2fa:${sessionUser.id}`);
    const { code } = totpCodeSchema.parse(input);
    const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new UserError("2FA não está ativo.");
    if (!verifyTotp(code, openSecret(user.twoFactorSecret))) throw new UserError("Código inválido.");
    await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    return null;
  });
}
