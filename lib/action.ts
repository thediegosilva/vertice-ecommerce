import { ZodError } from "zod";
import { AuthError } from "./auth-guard";
import { RateLimitError } from "./rate-limit";
import { firstError } from "./validators";
import { logger } from "./logger";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export class UserError extends Error {}

/** Envolve Server Actions: converte erros conhecidos em mensagens seguras (sem vazar stack/detalhes). */
export async function runAction<T>(name: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: firstError(e) };
    if (e instanceof AuthError || e instanceof RateLimitError || e instanceof UserError) return { ok: false, error: e.message };
    // redirect()/notFound() do Next precisam propagar
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_")) throw e;
    logger.error(`action.${name}.failed`, e);
    return { ok: false, error: "Algo deu errado. Tente novamente." };
  }
}
