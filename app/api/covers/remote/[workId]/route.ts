import { env } from "cloudflare:workers";
import coverMap from "../../../../data/cover-map.json";

export const dynamic = "force-dynamic";

type CoverIndex = {
  covers: Array<{ workId: string; url: string; sourcePage?: string | null }>;
};
const covers = new Map((coverMap as CoverIndex).covers.map((cover) => [cover.workId, cover]));

export async function GET(_request: Request, { params }: { params: Promise<{ workId: string }> }) {
  const { workId } = await params;
  const record = covers.get(workId);
  if (!record) return new Response("Обложка не найдена", { status: 404 });

  const key = `catalog-covers/${workId}`;
  const cached = await env.BUCKET.get(key);
  if (cached) {
    const headers = new Headers();
    cached.writeHttpMetadata(headers);
    headers.set("etag", cached.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(cached.body, { headers });
  }

  try {
    const response = await fetch(record.url, {
      headers: {
        accept: "image/avif,image/webp,image/jpeg,image/png,image/*",
        "user-agent": "VladaBooks/1.0 (private-library-cover-cache)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) throw new Error("Источник не вернул изображение");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) throw new Error("Изображение слишком большое");
    await env.BUCKET.put(key, buffer, {
      httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { source: record.sourcePage ?? record.url },
    });
    return new Response(buffer, {
      headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return Response.redirect(record.url, 302);
  }
}
