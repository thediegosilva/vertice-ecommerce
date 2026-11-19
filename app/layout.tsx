import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Archivo } from "next/font/google";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Effects } from "@/components/effects";
import { themeScript } from "@/lib/theme-script";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Archivo({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800", "900"], display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "VÉRTICE — Vista a cidade. Viva o movimento.", template: "%s | VÉRTICE" },
  description: "Moda, calçados, tech e acessórios premium com design autoral. Frete grátis acima de R$ 399 e 10x sem juros.",
  keywords: ["moda", "streetwear", "tênis", "e-commerce", "VÉRTICE"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "VÉRTICE",
    images: [{ url: "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1200&h=630&q=80", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, h] = await Promise.all([auth(), headers()]);
  const nonce = h.get("x-nonce") ?? undefined;
  const user = session?.user ? { name: session.user.name ?? null, email: session.user.email ?? null, role: session.user.role } : null;
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {/* Tema aplicado antes da pintura (evita flash). Conteúdo estático, com nonce da CSP. */}
        {/* eslint-disable-next-line react/no-danger */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Pular para o conteúdo
        </a>
        <Providers isLoggedIn={!!user}>
          <AnnouncementBar />
          <Suspense fallback={<div className="h-16 md:h-[72px]" />}>
            <Header user={user} />
          </Suspense>
          <main id="conteudo">{children}</main>
          <Footer />
          <CartDrawer />
          <Effects />
        </Providers>
      </body>
    </html>
  );
}
