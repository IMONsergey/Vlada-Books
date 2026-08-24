import { updateReading } from "../../../../lib/catalog-store";
import type { ReadingStatus } from "../../../../lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workId: string }> },
) {
  try {
    const { workId } = await params;
    const payload = (await request.json()) as {
      status?: ReadingStatus;
      progress?: number;
      rating?: number | null;
      notes?: string | null;
      startedAt?: string | null;
      finishedAt?: string | null;
      minutes?: number | null;
    };
    const updated = await updateReading(workId, payload);
    if (!updated) return Response.json({ error: "Книга не найдена" }, { status: 404 });
    return Response.json({ reading: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить изменения";
    return Response.json({ error: message }, { status: 400 });
  }
}
