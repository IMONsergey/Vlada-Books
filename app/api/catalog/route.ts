import { listCatalog } from "../../../lib/catalog-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await listCatalog(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить библиотеку";
    return Response.json({ error: message }, { status: 500 });
  }
}
