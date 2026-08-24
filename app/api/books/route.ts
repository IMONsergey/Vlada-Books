import { createManualBook } from "../../../lib/catalog-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Parameters<typeof createManualBook>[0];
    const created = await createManualBook(payload);
    return Response.json({ book: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось добавить книгу";
    return Response.json({ error: message }, { status: 400 });
  }
}
