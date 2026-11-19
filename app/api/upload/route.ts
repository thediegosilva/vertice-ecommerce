import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin, AuthError } from "@/lib/auth-guard";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/upload";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const configured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: e instanceof AuthError ? e.message : "Não autorizado" }, { status: 401 });
  }
  const rl = await rateLimit("write", `upload:${ipFromHeaders(req.headers)}`);
  if (!rl.success) return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  if (!configured) return NextResponse.json({ error: "Cloudinary não configurado (veja .env.example)" }, { status: 503 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) return NextResponse.json({ error: "Arquivo maior que 5MB" }, { status: 413 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

  const buf = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(buf, file.size);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 415 });

  // Nome aleatório (UUID) — nunca usa o nome enviado; resource_type "image" impede execução
  const publicId = randomUUID();
  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "vertice/products", public_id: publicId, resource_type: "image", overwrite: false, allowed_formats: ["jpg", "png", "webp", "avif"] },
          (err, res) => (err || !res ? reject(err) : resolve(res)),
        )
        .end(Buffer.from(buf));
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (e) {
    logger.error("upload.failed", e);
    return NextResponse.json({ error: "Falha no upload" }, { status: 502 });
  }
}
