import { and, asc, count, eq } from "drizzle-orm";
import catalogSeed from "../app/data/catalog-seed.json";
import { getDb } from "../db";
import {
  contributors,
  copies,
  editions,
  progressEvents,
  readingAttempts,
  workContributors,
  works,
} from "../db/schema";
import type { CatalogItem, CatalogResponse, ReadingStatus } from "./types";

const CHUNK_SIZE = 40;
const readingStatuses = new Set<ReadingStatus>([
  "owned",
  "want_to_read",
  "reading",
  "read",
  "dnf",
]);

function chunks<T>(items: T[], size = CHUNK_SIZE) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export async function ensureCatalogSeeded() {
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(works);
  if (value > 0) return;

  for (const batch of chunks(catalogSeed.works)) {
    await db.insert(works).values(batch).onConflictDoNothing();
  }
  for (const batch of chunks(catalogSeed.contributors)) {
    await db.insert(contributors).values(batch).onConflictDoNothing();
  }
  for (const batch of chunks(catalogSeed.workContributors)) {
    await db.insert(workContributors).values(batch).onConflictDoNothing();
  }
  for (const batch of chunks(catalogSeed.editions)) {
    await db.insert(editions).values(batch).onConflictDoNothing();
  }
  for (const batch of chunks(catalogSeed.copies)) {
    await db.insert(copies).values(batch).onConflictDoNothing();
  }
}

export async function listCatalog(): Promise<CatalogResponse> {
  await ensureCatalogSeeded();
  const db = getDb();
  const rows = await db
    .select({
      work: works,
      edition: editions,
      copy: copies,
      attempt: readingAttempts,
    })
    .from(works)
    .innerJoin(editions, eq(editions.workId, works.id))
    .innerJoin(copies, eq(copies.editionId, editions.id))
    .leftJoin(
      readingAttempts,
      and(eq(readingAttempts.workId, works.id), eq(readingAttempts.isActive, true)),
    )
    .orderBy(asc(works.sortTitle), asc(editions.id));

  const grouped = new Map<string, CatalogItem>();
  for (const row of rows) {
    const current = grouped.get(row.work.id);
    if (current) {
      current.copies += 1;
      continue;
    }
    grouped.set(row.work.id, {
      id: row.work.id,
      title: row.work.title,
      primaryAuthor: row.work.primaryAuthor,
      genre: row.work.genre,
      mediaType: row.work.mediaType,
      editionId: row.edition.id,
      publisher: row.edition.publisher,
      publicationYear: row.edition.publicationYear,
      illustrator: row.edition.illustrator,
      language: row.edition.language,
      features: row.edition.features,
      format: row.edition.format,
      coverKey: row.edition.coverKey,
      coverUrl: row.edition.coverKey
        ? `/api/covers/${row.edition.coverKey}`
        : row.edition.coverUrl,
      pages: row.edition.pages,
      copies: 1,
      status: (row.attempt?.status as ReadingStatus | undefined) ?? "owned",
      progress: row.attempt?.progress ?? 0,
      rating: row.attempt?.rating ?? null,
      startedAt: row.attempt?.startedAt ?? null,
      finishedAt: row.attempt?.finishedAt ?? null,
      notes: row.attempt?.notes ?? null,
    });
  }

  return {
    items: [...grouped.values()],
    source: "database",
    meta: {
      works: grouped.size,
      editions: rows.length,
      copies: rows.length,
    },
  };
}

type ReadingUpdate = {
  status?: ReadingStatus;
  progress?: number;
  rating?: number | null;
  notes?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  minutes?: number | null;
};

export async function updateReading(workId: string, payload: ReadingUpdate) {
  const db = getDb();
  const work = await db.select({ id: works.id }).from(works).where(eq(works.id, workId)).limit(1);
  if (!work.length) return null;

  const active = await db
    .select()
    .from(readingAttempts)
    .where(and(eq(readingAttempts.workId, workId), eq(readingAttempts.isActive, true)))
    .limit(1);
  const now = new Date().toISOString();
  const requestedStatus = payload.status ?? (active[0]?.status as ReadingStatus | undefined) ?? "owned";
  if (!readingStatuses.has(requestedStatus)) throw new Error("Недопустимый статус");
  const progress = Math.max(
    0,
    Math.min(100, requestedStatus === "read" ? 100 : payload.progress ?? active[0]?.progress ?? 0),
  );
  const values = {
    status: requestedStatus,
    progress,
    rating: payload.rating === undefined ? active[0]?.rating ?? null : payload.rating,
    notes: payload.notes === undefined ? active[0]?.notes ?? null : payload.notes?.trim() || null,
    startedAt:
      payload.startedAt === undefined
        ? active[0]?.startedAt ?? (requestedStatus === "reading" || requestedStatus === "read" ? now : null)
        : payload.startedAt,
    finishedAt:
      payload.finishedAt === undefined
        ? requestedStatus === "read"
          ? active[0]?.finishedAt ?? now
          : active[0]?.finishedAt ?? null
        : payload.finishedAt,
    updatedAt: now,
  };

  let attemptId: number;
  if (active[0]) {
    attemptId = active[0].id;
    await db.update(readingAttempts).set(values).where(eq(readingAttempts.id, attemptId));
  } else {
    const [created] = await db
      .insert(readingAttempts)
      .values({ workId, ...values })
      .returning({ id: readingAttempts.id });
    attemptId = created.id;
  }

  if (payload.progress !== undefined || payload.minutes) {
    await db.insert(progressEvents).values({
      attemptId,
      progress,
      minutes: payload.minutes ? Math.max(1, Math.round(payload.minutes)) : null,
      occurredAt: now,
    });
  }

  return { attemptId, ...values };
}

export async function createManualBook(payload: {
  title: string;
  primaryAuthor?: string;
  genre?: string;
  publisher?: string;
  publicationYear?: number | null;
  language?: string;
  features?: string;
  isbn13?: string;
  coverUrl?: string;
}) {
  const title = payload.title.trim();
  if (!title) throw new Error("Укажите название");
  const db = getDb();
  const suffix = crypto.randomUUID();
  const workId = `work-${suffix}`;
  const editionId = `edition-${suffix}`;
  const copyId = `copy-${suffix}`;
  const primaryAuthor = payload.primaryAuthor?.trim() || "Автор не указан";

  await db.batch([
    db.insert(works).values({
      id: workId,
      title,
      sortTitle: title.toLocaleLowerCase("ru-RU"),
      primaryAuthor,
      genre: payload.genre?.trim() || "Без жанра",
      mediaType: "book",
    }),
    db.insert(editions).values({
      id: editionId,
      workId,
      publisher: payload.publisher?.trim() || null,
      publicationYear: payload.publicationYear ?? null,
      language: payload.language || "ru",
      features: payload.features?.trim() || null,
      isbn13: payload.isbn13?.trim() || null,
      coverUrl: payload.coverUrl?.trim() || null,
    }),
    db.insert(copies).values({ id: copyId, editionId, ownershipStatus: "owned" }),
  ]);

  return { workId, editionId, copyId };
}
