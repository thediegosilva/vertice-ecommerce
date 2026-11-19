import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/validators";
import { dummyVerify, verifyPassword } from "@/lib/password";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";
import { openSecret, verifyTotp } from "@/lib/totp";
import { logger } from "@/lib/logger";
import { mergeGuestCartOnLogin } from "@/lib/cart";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // "access" de 15 minutos
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // sessão (refresh) de 7 dias

class InvalidCredentials extends CredentialsSignin {
  code = "invalid";
}
class AccountLocked extends CredentialsSignin {
  code = "locked";
}
class TwoFactorRequired extends CredentialsSignin {
  code = "2fa_required";
}
class TwoFactorInvalid extends CredentialsSignin {
  code = "2fa_invalid";
}
class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsInput = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  totp: z.string().regex(/^\d{6}$/).optional().or(z.literal("")),
});

async function registerFailure(userId: string, attempts: number) {
  const next = attempts + 1;
  if (next >= MAX_FAILED_ATTEMPTS) {
    await db.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000) },
    });
    logger.warn("auth.account_locked", { userId });
  } else {
    await db.user.update({ where: { id: userId }, data: { failedLoginAttempts: next } });
  }
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: {}, password: {}, totp: {} },
    async authorize(raw, request) {
      const parsed = credentialsInput.safeParse(raw);
      if (!parsed.success) throw new InvalidCredentials();
      const { email, password, totp } = parsed.data;

      // Rate limit: 5/min por IP e por email
      const ip = request instanceof Request ? ipFromHeaders(request.headers) : "unknown";
      const [byIp, byEmail] = await Promise.all([rateLimit("login", ip), rateLimit("login", `email:${email}`)]);
      if (!byIp.success || !byEmail.success) throw new RateLimited();

      const user = await db.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        await dummyVerify(password); // tempo constante — evita enumeração de usuários
        throw new InvalidCredentials();
      }
      if (user.lockedUntil && user.lockedUntil > new Date()) throw new AccountLocked();

      const ok = await verifyPassword(user.passwordHash, password);
      if (!ok) {
        await registerFailure(user.id, user.failedLoginAttempts);
        throw new InvalidCredentials();
      }

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!totp) throw new TwoFactorRequired();
        if (!verifyTotp(totp, openSecret(user.twoFactorSecret))) {
          await registerFailure(user.id, user.failedLoginAttempts);
          throw new TwoFactorInvalid();
        }
      }

      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
      }
      return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, tokenVersion: user.tokenVersion };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ allowDangerousEmailAccountLinking: false }));
}

export const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: REFRESH_TTL_SEC },
  // Cookies: httpOnly + SameSite=Lax + Secure (prefixo __Secure- em HTTPS) — padrão do Auth.js
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Login inicial
        const u = user as { id: string; role?: "USER" | "ADMIN"; tokenVersion?: number };
        const fresh = u.role === undefined ? await db.user.findUnique({ where: { id: u.id }, select: { role: true, tokenVersion: true } }) : null;
        token.sub = u.id;
        token.role = u.role ?? fresh?.role ?? "USER";
        token.tv = u.tokenVersion ?? fresh?.tokenVersion ?? 0;
        token.jti = randomUUID();
        token.accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
        return token;
      }
      // "Access token" expirado: revalida no banco e ROTACIONA o identificador do token
      if (typeof token.accessExp !== "number" || Date.now() > token.accessExp) {
        if (!token.sub) return null;
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, tokenVersion: true, lockedUntil: true, name: true, image: true },
        });
        // Usuário removido, senha trocada (tokenVersion) ou conta bloqueada => sessão invalidada
        if (!dbUser || dbUser.tokenVersion !== token.tv || (dbUser.lockedUntil && dbUser.lockedUntil > new Date())) return null;
        token.role = dbUser.role;
        token.name = dbUser.name;
        token.picture = dbUser.image;
        token.jti = randomUUID();
        token.accessExp = Date.now() + ACCESS_TOKEN_TTL_MS;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path.startsWith("/admin")) return auth?.user?.role === "ADMIN";
      if (path.startsWith("/conta") || path.startsWith("/checkout")) return !!auth?.user;
      return true;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await mergeGuestCartOnLogin(user.id).catch((e) => logger.error("cart.merge_failed", e));
      logger.info("auth.sign_in", { userId: user.id });
    },
  },
  logger: {
    error: (error) => {
      if (error instanceof CredentialsSignin) return; // falhas de login esperadas não poluem logs
      logger.error("auth.error", { name: error.name, message: error.message });
    },
    warn: (code) => logger.warn("auth.warn", { code }),
  },
});
