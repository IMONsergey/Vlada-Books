import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");
  if (!key.startsWith("covers/") || key.includes("..")) {
    return new Response("Invalid key", { status: 400 });
  }
  const object = await env.BUCKET.get(key, {
    onlyIf: request.headers,
  });
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  if (!object.body) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}
