import { hash, verify } from "@node-rs/argon2";

const ARGON2ID = 2; // Algorithm.Argon2id (const enum)

// Argon2id — parâmetros recomendados pela OWASP (m=19MiB, t=2, p=1)
const OPTIONS = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Hash "dummy" para equalizar tempo de resposta quando o usuário não existe (evita enumeração)
let dummy: Promise<string> | null = null;
export async function dummyVerify(password: string) {
  dummy ??= hashPassword("vertice-dummy-password");
  await verifyPassword(await dummy, password);
  return false;
}
