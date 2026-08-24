import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { editions } from "../../../db/schema";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const editionId = String(form.get("editionId") ?? "").trim();
    const file = form.get("file");
    if (!editionId || !(file instanceof File)) {
      return Response.json({ error: "Нужны editionId и файл" }, { status: 400 });
    }
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "Допустимы JPG, PNG, WebP или AVIF до 5 МБ" }, { status: 400 });
    }
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `covers/${editionId}/${crypto.randomUUID()}.${extension}`;
    const buffer = await file.arrayBuffer();
    await env.BUCKET.put(key, buffer, {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    });
    await getDb().update(editions).set({ coverKey: key }).where(eq(editions.id, editionId));
    return Response.json({ key, url: `/api/covers/${key}` }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить обложку";
    return Response.json({ error: message }, { status: 500 });
  }
}
