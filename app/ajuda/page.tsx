import type { Metadata } from "next";

export const metadata: Metadata = { title: "Central de ajuda" };

const SECTIONS = [
  ["envio", "Envio e prazos", "Enviamos para todo o Brasil. Frete Padrão (3 a 7 dias úteis) por R$ 29,90 — grátis em compras acima de R$ 399. Frete Expresso (1 a 2 dias úteis) por R$ 49,90. O código de rastreio aparece em Minha conta › Pedidos assim que o pedido é postado."],
  ["trocas", "Trocas e devoluções", "Você tem 30 dias após o recebimento para trocar ou devolver gratuitamente, desde que o produto esteja sem uso e com etiqueta. Solicite pelo email de contato com o número do pedido."],
  ["pagamentos", "Pagamentos", "Aceitamos cartões de crédito em até 10x sem juros. O pagamento é processado pelo Stripe — a VÉRTICE nunca vê nem armazena o número do seu cartão ou o CVV. Este é um projeto de portfólio: pagamentos estão em modo de teste."],
  ["privacidade", "Privacidade (LGPD)", "Coletamos apenas os dados necessários para processar seu pedido (nome, email, endereço). Senhas são armazenadas com Argon2id e nunca em texto puro. Você pode solicitar exportação ou exclusão dos seus dados a qualquer momento."],
  ["sustentabilidade", "Sustentabilidade", "Embalagens 100% recicláveis, produção local sempre que possível e compensação de carbono nos envios."],
  ["termos", "Termos de uso", "Ao usar o site você concorda com nossas políticas de compra, troca e privacidade descritas nesta página."],
  ["contato", "Fale conosco", "Atendimento de segunda a sexta, das 9h às 18h, pelo email contato@vertice.dev."],
];

export default function HelpPage() {
  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <h1 className="font-display text-4xl font-black uppercase md:text-6xl">Central de ajuda</h1>
      <div className="mt-10 divide-y border-y">
        {SECTIONS.map(([id, title, text]) => (
          <details key={id} id={id} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold">
              {title}<span className="text-flame transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
