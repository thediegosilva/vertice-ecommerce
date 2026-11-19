import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

type Rule = { limit: number; windowSec: number };

export const RULES = {
  global: { limit: 100, windowSec: 60 },
  login: { limit: 5, windowSec: 60 },
  checkout: { limit: 10, windowSec: 60 },
  sensitive: { limit: 5, windowSec: 60 * 15 }, // reset de senha, cadastro
  write: { limit: 30, windowSec: 60 }, // carrinho, favoritos, reviews
} satisfies Record<string, Rule>;

export type RuleName = keyof typeof RULES;

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const upstash = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<RuleName, Ratelimit>();

function upstashLimiter(name: RuleName) {
  let l = limiters.get(name);
  if (!l) {
    const r = RULES[name];
    l = new Ratelimit({
      redis: upstash!,
      limiter: Ratelimit.slidingWindow(r.limit, `${r.windowSec} s`),
      prefix: `vertice:rl:${name}`,
      analytics: false,
    });
    limiters.set(name, l);
  }
  return l;
}

// Fallback em memória (dev / instância única). Em produção configure Upstash.
const memory = new Map<string, { count: number; reset: number }>();
function memoryLimit(key: string, rule: Rule) {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    memory.set(key, { count: 1, reset: now + rule.windowSec * 1000 });
    if (memory.size > 10_000) for (const [k, v] of memory) if (v.reset < now) memory.delete(k);
    return { success: true, remaining: rule.limit - 1, reset: now + rule.windowSec * 1000 };
  }
  entry.count++;
  return { success: entry.count <= rule.limit, remaining: Math.max(0, rule.limit - entry.count), reset: entry.reset };
}

export async function rateLimit(name: RuleName, identifier: string) {
  if (process.env.DISABLE_RATE_LIMIT === "true" && process.env.NODE_ENV !== "production") {
    return { success: true, remaining: 999, reset: 0 };
  }
  const key = `${name}:${identifier}`;
  if (upstash) {
    const r = await upstashLimiter(name).limit(identifier);
    return { success: r.success, remaining: r.remaining, reset: r.reset };
  }
  return memoryLimit(key, RULES[name]);
}

export function ipFromHeaders(h: Headers) {
  // Na Vercel, x-forwarded-for é definido pela plataforma (primeiro IP = cliente)
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}

export class RateLimitError extends Error {
  constructor() {
    super("Muitas tentativas. Aguarde um momento e tente novamente.");
  }
}

/** Para Server Actions: lança RateLimitError se exceder. */
export async function enforceRateLimit(name: RuleName, extra = "") {
  const ip = await clientIp();
  const r = await rateLimit(name, `${ip}${extra ? `:${extra}` : ""}`);
  if (!r.success) throw new RateLimitError();
}
