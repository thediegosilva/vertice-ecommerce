import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

// Instância leve (Edge-safe): só lê o JWT. Sem Prisma/Argon2 no middleware.
const { auth } = NextAuth(authConfig);

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com https://lh3.googleusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self' https://viacep.com.br${isDev ? " ws:" : ""}`,
    `frame-src https://checkout.stripe.com`,
    `frame-ancestors 'none'`,
    `form-action 'self' https://accounts.google.com https://checkout.stripe.com`,
    `base-uri 'self'`,
    `object-src 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function sameOrigin(req: Request, host: string | null) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const allowed = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : null;
    return o.host === host || (allowed !== null && o.host === allowed);
  } catch {
    return false;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isWebhook = pathname.startsWith("/api/webhooks/");

  // 1) Rate limit global: 100 req/min por IP
  if (!isWebhook) {
    const ip = ipFromHeaders(req.headers);
    const rl = await rateLimit("global", ip);
    if (!rl.success) {
      return new NextResponse("Muitas requisições. Tente novamente em instantes.", {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))) },
      });
    }
  }

  // 2) CSRF: mutações em /api exigem Origin do próprio app (webhooks usam assinatura; Auth.js tem token CSRF próprio)
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (mutating && pathname.startsWith("/api/") && !isWebhook && !pathname.startsWith("/api/auth/")) {
    if (!sameOrigin(req, req.headers.get("host"))) {
      return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
    }
  }

  // 3) Rotas protegidas: exige sessão
  const isProtected = ["/conta", "/checkout", "/admin"].some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !req.auth?.user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  // 4) Admin: usuário logado sem role ADMIN recebe 404 (não revela a rota)
  if (pathname.startsWith("/admin") && req.auth?.user && req.auth.user.role !== "ADMIN") {
    return NextResponse.rewrite(new URL("/404", req.url), { status: 404 });
  }

  // 5) CSP com nonce por requisição
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
});

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
