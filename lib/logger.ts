/**
 * Logger com mascaramento: nunca registra senhas, tokens, cartões ou PII em claro.
 */
const SENSITIVE_KEYS = /pass(word)?|secret|token|authorization|cookie|card|cvv|cvc|otp|code|hash/i;

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export function maskCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.***-**` : "***";
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[depth]";
  if (typeof value === "string") {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (m) => maskEmail(m))
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, (m) => maskCpf(m))
      .replace(/\b(?:\d[ -]?){13,19}\b/g, "[card]");
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: redact(value.message, depth + 1) };
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SENSITIVE_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1),
      ]),
    );
  }
  return value;
}

function emit(level: "info" | "warn" | "error", msg: string, meta?: unknown) {
  const line = JSON.stringify({ level, msg, ...(meta ? { meta: redact(meta) } : {}), ts: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
};
