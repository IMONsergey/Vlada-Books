import catalogSeed from "../app/data/catalog-seed.json";
import coverMap from "../app/data/cover-map.json";
import type { CatalogItem, CatalogResponse } from "./types";

type CoverIndex = {
  meta: { found: number };
  covers: Array<{ workId: string; editionId: string | null; url: string }>;
};

export function getSeedCatalog(): CatalogResponse {
  const editionByWork = new Map<string, (typeof catalogSeed.editions)[number]>();
  const copiesByEdition = new Map<string, number>();
  const coverIndex = coverMap as CoverIndex;
  const coversByWork = new Map(coverIndex.covers.map((cover) => [cover.workId, cover]));

  for (const edition of catalogSeed.editions) {
    if (!editionByWork.has(edition.workId)) editionByWork.set(edition.workId, edition);
  }
  for (const copy of catalogSeed.copies) {
    copiesByEdition.set(copy.editionId, (copiesByEdition.get(copy.editionId) ?? 0) + 1);
  }

  const items: CatalogItem[] = catalogSeed.works.map((work) => {
    const edition = editionByWork.get(work.id);
    const cover = coversByWork.get(work.id);
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
      coverUrl: cover?.url ?? null,
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
      covers: coverIndex.covers.length,
    },
  };
}
