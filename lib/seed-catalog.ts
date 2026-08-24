import catalogSeed from "../app/data/catalog-seed.json";
import type { CatalogItem, CatalogResponse } from "./types";

export function getSeedCatalog(): CatalogResponse {
  const editionByWork = new Map<string, (typeof catalogSeed.editions)[number]>();
  const copiesByEdition = new Map<string, number>();

  for (const edition of catalogSeed.editions) {
    if (!editionByWork.has(edition.workId)) editionByWork.set(edition.workId, edition);
  }
  for (const copy of catalogSeed.copies) {
    copiesByEdition.set(copy.editionId, (copiesByEdition.get(copy.editionId) ?? 0) + 1);
  }

  const items: CatalogItem[] = catalogSeed.works.map((work) => {
    const edition = editionByWork.get(work.id);
    return {
      id: work.id,
      title: work.title,
      primaryAuthor: work.primaryAuthor,
      genre: work.genre,
      mediaType: work.mediaType,
      editionId: edition?.id ?? `edition-${work.id}`,
      publisher: edition?.publisher ?? null,
      publicationYear: edition?.publicationYear ?? null,
      illustrator: edition?.illustrator ?? null,
      language: edition?.language ?? "ru",
      features: edition?.features ?? null,
      format: edition?.format ?? "hardcopy",
      coverUrl: null,
      coverKey: null,
      pages: null,
      copies: edition ? copiesByEdition.get(edition.id) ?? 1 : 1,
      status: "owned",
      progress: 0,
      rating: null,
      startedAt: null,
      finishedAt: null,
      notes: null,
    };
  });

  return {
    items,
    source: "seed",
    meta: {
      works: catalogSeed.meta.workCount,
      editions: catalogSeed.meta.editionCount,
      copies: catalogSeed.meta.copyCount,
    },
  };
}
