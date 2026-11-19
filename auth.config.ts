import type { NextAuthConfig } from "next-auth";

/**
 * Configuração "leve" do Auth.js, compatível com Edge Runtime.
 * Usada pelo middleware: só decodifica/valida o JWT — sem Prisma, sem Argon2
 * (módulos nativos que não rodam em Edge Functions / Netlify).
 * A configuração completa (adapter, providers, revalidação no banco) fica em auth.ts.
 */
export const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // sessão (refresh) de 7 dias

export const authConfig = {
  session: { strategy: "jwt", maxAge: REFRESH_TTL_SEC },
  // Cookies: httpOnly + SameSite=Lax + Secure (prefixo __Secure- em HTTPS) — padrão do Auth.js
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    // No middleware o token só é lido; a revalidação no banco acontece no servidor (auth.ts)
    jwt: ({ token }) => token,
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      return session;
    },
  },
} satisfies NextAuthConfig;
