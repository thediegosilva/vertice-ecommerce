import "server-only";
import { authenticator } from "otplib";
import { decrypt, encrypt } from "./crypto";

authenticator.options = { window: 1, step: 30, digits: 6 };

export function createTotpSecret() {
  return authenticator.generateSecret(20);
}

export function totpUri(email: string, secret: string) {
  return authenticator.keyuri(email, "VÉRTICE", secret);
}

export function verifyTotp(code: string, secret: string) {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

export const sealSecret = encrypt;
export const openSecret = decrypt;
