/**
 * Validação de upload por "magic bytes" (tipo MIME REAL do conteúdo,
 * não o informado pelo navegador). Apenas imagens raster são aceitas.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; ext: string };

export function detectImageType(buf: Uint8Array): ImageKind | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a)
    return { mime: "image/png", ext: "png" };
  const ascii = (s: number, e: number) => String.fromCharCode(...buf.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return { mime: "image/avif", ext: "avif" };
  return null; // SVG/HTML/executáveis são rejeitados
}

export function validateUpload(buf: Uint8Array, size: number): { ok: true; kind: ImageKind } | { ok: false; error: string } {
  if (size <= 0) return { ok: false, error: "Arquivo vazio" };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, error: "Arquivo maior que 5MB" };
  const kind = detectImageType(buf);
  if (!kind) return { ok: false, error: "Formato não suportado (use JPG, PNG, WEBP ou AVIF)" };
  return { ok: true, kind };
}
