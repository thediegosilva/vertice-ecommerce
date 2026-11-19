import "server-only";
import { Resend } from "resend";
import { logger } from "./logger";
import { absoluteUrl, formatBRL } from "./utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "VÉRTICE <onboarding@resend.dev>";

/** Escapa qualquer dado dinâmico inserido no HTML do email (anti-XSS). */
export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#FAF9F6;font-family:Helvetica,Arial,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 24px">
    <tr><td style="font-size:22px;font-weight:900;letter-spacing:.08em">VÉRTICE<span style="color:#FF4D00">.</span></td></tr>
    <tr><td style="padding-top:28px"><h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>${body}</td></tr>
    <tr><td style="padding-top:40px;font-size:12px;color:#777;border-top:1px solid #E8E6E1">VÉRTICE — Vista a cidade. Viva o movimento.<br/>Este é um email automático, não responda.</td></tr>
  </table></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    logger.info("email.skipped (RESEND_API_KEY ausente)", { to, subject });
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) logger.error("email.failed", { to, subject, error: error.message });
}

type OrderEmail = {
  number: string;
  email: string;
  customerName: string | null;
  items: { name: string; quantity: number; unitPriceCents: number; size: string; color: string }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

export async function sendOrderConfirmation(order: OrderEmail) {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #E8E6E1">${escapeHtml(i.name)}${
        i.size || i.color ? `<br/><small style="color:#777">${escapeHtml([i.size, i.color].filter(Boolean).join(" · "))}</small>` : ""
      }</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${formatBRL(i.unitPriceCents * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, v: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;${bold ? "font-weight:700" : ""}">${label}</td><td style="text-align:right;${bold ? "font-weight:700" : ""}">${v}</td></tr>`;
  const html = layout(
    `Pedido ${order.number} confirmado!`,
    `<p>Olá${order.customerName ? `, ${escapeHtml(order.customerName.split(" ")[0])}` : ""}! Recebemos o pagamento do seu pedido. Em breve ele será enviado.</p>
    <table width="100%" style="font-size:14px;border-collapse:collapse;margin:16px 0">${rows}
    ${line("Subtotal", formatBRL(order.subtotalCents))}
    ${order.discountCents ? line("Desconto", `- ${formatBRL(order.discountCents)}`) : ""}
    ${line("Frete", order.shippingCents ? formatBRL(order.shippingCents) : "Grátis")}
    ${line("Total", formatBRL(order.totalCents), true)}</table>
    <a href="${absoluteUrl(`/conta/pedidos/${encodeURIComponent(order.number)}`)}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700">Acompanhar pedido</a>`,
  );
  await send(order.email, `Pedido ${order.number} confirmado — VÉRTICE`, html);
}

export async function sendPasswordReset(email: string, token: string) {
  const url = absoluteUrl(`/redefinir-senha?token=${encodeURIComponent(token)}`);
  const html = layout(
    "Redefinir sua senha",
    `<p>Recebemos uma solicitação para redefinir sua senha. O link expira em <b>1 hora</b> e só pode ser usado uma vez.</p>
     <a href="${url}" style="display:inline-block;background:#FF4D00;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700">Criar nova senha</a>
     <p style="color:#777;font-size:13px">Se não foi você, ignore este email — sua senha continua a mesma.</p>`,
  );
  await send(email, "Redefinição de senha — VÉRTICE", html);
  if (!resend && process.env.NODE_ENV !== "production") {
    // Apenas em desenvolvimento, para conseguir testar sem Resend configurado
    console.log(`[dev] link de redefinição: ${url}`);
  }
}

export async function sendOrderShipped(email: string, number: string, trackingCode: string) {
  const html = layout(
    `Seu pedido ${number} foi enviado`,
    `<p>Boa notícia! Seu pedido está a caminho. Código de rastreio: <b>${escapeHtml(trackingCode)}</b></p>
     <a href="${absoluteUrl(`/conta/pedidos/${encodeURIComponent(number)}`)}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700">Rastrear</a>`,
  );
  await send(email, `Pedido ${number} enviado — VÉRTICE`, html);
}

export async function sendWelcome(email: string, name: string) {
  const html = layout(
    `Bem-vindo(a), ${name.split(" ")[0]}`,
    `<p>Sua conta VÉRTICE está pronta. Use o cupom <b>VERTICE10</b> e ganhe 10% OFF na primeira compra.</p>
     <a href="${absoluteUrl("/shop")}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700">Ver coleção</a>`,
  );
  await send(email, "Bem-vindo(a) à VÉRTICE", html);
}
