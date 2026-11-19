import Link from "next/link";
import { Instagram, Youtube, Twitter, CreditCard, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const COLUMNS = [
  { title: "Loja", links: [["Novidades", "/shop?sort=newest"], ["Calçados", "/shop?category=calcados"], ["Vestuário", "/shop?category=vestuario"], ["Tech", "/shop?category=tech"], ["Acessórios", "/shop?category=acessorios"], ["Beleza", "/shop?category=beleza"]] },
  { title: "Ajuda", links: [["Meus pedidos", "/conta/pedidos"], ["Trocas e devoluções", "/ajuda#trocas"], ["Envio e prazos", "/ajuda#envio"], ["Pagamentos", "/ajuda#pagamentos"], ["Fale conosco", "/ajuda#contato"]] },
  { title: "VÉRTICE", links: [["Sobre nós", "/lookbook"], ["Lookbook", "/lookbook"], ["Sustentabilidade", "/ajuda#sustentabilidade"], ["Privacidade", "/ajuda#privacidade"], ["Termos de uso", "/ajuda#termos"]] },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 bg-night text-chalk">
      <div className="border-b border-white/10">
        <div className="container grid grid-cols-2 gap-6 py-8 text-sm md:grid-cols-4">
          {[
            [Truck, "Frete grátis", "Acima de R$ 399"],
            [CreditCard, "10x sem juros", "Em todos os cartões"],
            [RotateCcw, "Troca grátis", "Em até 30 dias"],
            [ShieldCheck, "Compra segura", "Pagamento via Stripe"],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={t as string} className="flex items-center gap-3">
                <I className="size-6 text-flame" aria-hidden />
                <div>
                  <p className="font-semibold">{t as string}</p>
                  <p className="text-xs text-white/60">{d as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-white/60">Vista a cidade. Viva o movimento. Moda, tecnologia e acessórios com design autoral para quem não para.</p>
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest">Receba novidades</p>
            <NewsletterForm dark />
          </div>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">{col.title}</p>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-white/80 transition hover:text-flame">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/50 md:flex-row">
          <p>© {new Date().getFullYear()} VÉRTICE Comércio Digital Ltda. Projeto de portfólio — pagamentos em modo teste.</p>
          <div className="flex gap-4">
            {[[Instagram, "Instagram"], [Twitter, "X"], [Youtube, "YouTube"]].map(([Icon, label]) => {
              const I = Icon as typeof Instagram;
              return (
                <a key={label as string} href="#" aria-label={label as string} className="transition hover:text-flame">
                  <I className="size-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
