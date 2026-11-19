import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key, { typescript: true, appInfo: { name: "VERTICE" } }) : null;

/** Pagamento simulado só é permitido fora de produção e sem chave Stripe. */
export const mockPaymentsEnabled = !stripe && process.env.NODE_ENV !== "production";

if (key && process.env.NODE_ENV === "production" && key.startsWith("sk_live") === false && process.env.ALLOW_TEST_STRIPE !== "true") {
  // Portfólio: modo teste é esperado. Em produção real troque por sk_live_.
  console.warn("[stripe] usando chave de TESTE em produção");
}
