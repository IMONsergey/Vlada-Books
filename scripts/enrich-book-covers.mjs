import fs from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const CATALOG_PATH = new URL("app/data/catalog-seed.json", ROOT);
const COVER_PATH = new URL("app/data/cover-map.json", ROOT);
const REVIEW_PATH = new URL("app/data/cover-review.json", ROOT);
const force = process.argv.includes("--refresh");
const limitArg = process.argv.find((value) => value.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;

const catalog = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
const previous = await fs.readFile(COVER_PATH, "utf8").then(JSON.parse).catch(() => ({ covers: [] }));
const existing = new Map((previous.covers ?? []).map((cover) => [cover.workId, cover]));
const editionsByWork = new Map();
for (const edition of catalog.editions) {
  const list = editionsByWork.get(edition.workId) ?? [];
  list.push(edition);
  editionsByWork.set(edition.workId, list);
}

const normalize = (value = "") => String(value)
  .toLocaleLowerCase("ru-RU")
  .replaceAll("ё", "е")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\b(том|volume|vol)\.?\s*([ivx\d]+)\b/g, " том $2 ")
  .replace(/[^a-zа-я0-9]+/gi, " ")
  .trim()
  .replace(/\s+/g, " ");

const tokens = (value) => new Set(normalize(value).split(" ").filter((token) => token.length > 1));
function similarity(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aa = tokens(a);
  const bb = tokens(b);
  const intersection = [...aa].filter((token) => bb.has(token)).length;
  const union = new Set([...aa, ...bb]).size || 1;
  const jaccard = intersection / union;
  const containment = intersection / Math.max(1, Math.min(aa.size, bb.size));
  const substring = a.includes(b) || b.includes(a) ? 0.15 : 0;
  return Math.min(1, jaccard * 0.55 + containment * 0.45 + substring);
}

function candidateScore(work, edition, candidate) {
  const title = similarity(work.title, candidate.title);
  const authorKnown = work.primaryAuthor !== "Автор не указан";
  const author = authorKnown ? similarity(work.primaryAuthor, candidate.author) : 1;
  const publisher = edition?.publisher && candidate.publisher
    ? similarity(edition.publisher, candidate.publisher)
    : 0;
  const year = edition?.publicationYear && candidate.year
    ? Math.abs(edition.publicationYear - candidate.year) === 0 ? 1 : Math.abs(edition.publicationYear - candidate.year) <= 2 ? 0.5 : 0
    : 0;
  const score = title * (authorKnown ? 68 : 88) + author * (authorKnown ? 22 : 0) + publisher * 7 + year * 3;
  return { score: Math.round(score), titleSimilarity: title, authorSimilarity: author };
}

async function requestJson(url, attempt = 0) {
  const response = await fetch(url, {
    headers: { "user-agent": "VladaBooksCoverIndexer/1.0 (https://github.com/IMONsergey/Vlada-Books)" },
    signal: AbortSignal.timeout(15_000),
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 4) {
    const wait = Number(response.headers.get("retry-after") ?? 0) * 1000 || 800 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, wait));
    return requestJson(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function openLibraryCandidates(work) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", work.title);
  if (work.primaryAuthor !== "Автор не указан") url.searchParams.set("author", work.primaryAuthor);
  url.searchParams.set("limit", "12");
  url.searchParams.set("fields", "key,title,author_name,publisher,publish_year,cover_i,cover_edition_key,isbn");
  const data = await requestJson(url);
  return (data.docs ?? []).filter((item) => item.cover_i).map((item) => ({
    source: "openlibrary",
    sourceId: item.cover_edition_key ?? item.key?.replace("/works/", "") ?? String(item.cover_i),
    title: item.title ?? "",
    author: item.author_name?.join(", ") ?? "",
    publisher: item.publisher?.[0] ?? "",
    year: item.publish_year?.[0] ?? null,
    isbn: item.isbn?.find((value) => String(value).length === 13) ?? item.isbn?.[0] ?? null,
    url: `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`,
  }));
}

async function googleCandidates(work) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  const author = work.primaryAuthor === "Автор не указан" ? "" : ` inauthor:\"${work.primaryAuthor}\"`;
  url.searchParams.set("q", `intitle:\"${work.title}\"${author}`);
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("printType", "books");
  url.searchParams.set("projection", "lite");
  const data = await requestJson(url);
  return (data.items ?? []).flatMap((item) => {
    const info = item.volumeInfo ?? {};
    const image = info.imageLinks?.extraLarge ?? info.imageLinks?.large ?? info.imageLinks?.medium ?? info.imageLinks?.small ?? info.imageLinks?.thumbnail;
    if (!image) return [];
    return [{
      source: "google-books",
      sourceId: item.id,
      title: info.title ?? "",
      author: info.authors?.join(", ") ?? "",
      publisher: info.publisher ?? "",
      year: Number(String(info.publishedDate ?? "").slice(0, 4)) || null,
      isbn: info.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier ?? info.industryIdentifiers?.[0]?.identifier ?? null,
      url: String(image).replace(/^http:/, "https:").replace("zoom=1", "zoom=2"),
    }];
  });
}

async function resolveCover(work) {
  const edition = editionsByWork.get(work.id)?.[0] ?? null;
  const candidates = [];
  try { candidates.push(...await openLibraryCandidates(work)); } catch (error) { console.warn(`Open Library: ${work.title}: ${error.message}`); }
  const rankedOpen = candidates.map((candidate) => ({ ...candidate, ...candidateScore(work, edition, candidate) })).sort((a, b) => b.score - a.score);
  if (!rankedOpen[0] || rankedOpen[0].score < 82) {
    try { candidates.push(...await googleCandidates(work)); } catch (error) { console.warn(`Google Books: ${work.title}: ${error.message}`); }
  }
  const ranked = candidates.map((candidate) => ({ ...candidate, ...candidateScore(work, edition, candidate) })).sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  if (!winner || winner.titleSimilarity < 0.58 || winner.score < 58) return { winner: null, candidates: ranked.slice(0, 3) };
  return { winner, candidates: ranked.slice(0, 3) };
}

const covers = force ? new Map() : new Map(existing);
const review = [];
let processed = 0;
for (const work of catalog.works) {
  if (covers.has(work.id) || processed >= limit) continue;
  const edition = editionsByWork.get(work.id)?.[0];
  const { winner, candidates } = await resolveCover(work);
  processed += 1;
  if (winner) {
    const confidence = winner.score >= 84 ? "high" : winner.score >= 70 ? "medium" : "review";
    covers.set(work.id, {
      workId: work.id,
      editionId: edition?.id ?? null,
      url: winner.url,
      source: winner.source,
      sourceId: winner.sourceId,
      confidence,
      score: winner.score,
      matchedTitle: winner.title,
      matchedAuthor: winner.author || null,
      isbn: winner.isbn,
    });
    if (confidence === "review") review.push({ workId: work.id, title: work.title, author: work.primaryAuthor, reason: "low-confidence", candidates });
  } else {
    review.push({ workId: work.id, title: work.title, author: work.primaryAuthor, reason: "not-found", candidates });
  }
  console.log(`[${processed}] ${work.title} → ${winner ? `${winner.source} ${winner.score}` : "not found"}`);
  await new Promise((resolve) => setTimeout(resolve, 350));
}

const coverList = [...covers.values()].sort((a, b) => a.workId.localeCompare(b.workId));
const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    works: catalog.works.length,
    found: coverList.length,
    highConfidence: coverList.filter((item) => item.confidence === "high").length,
    mediumConfidence: coverList.filter((item) => item.confidence === "medium").length,
    needsReview: coverList.filter((item) => item.confidence === "review").length,
    unresolved: Math.max(0, catalog.works.length - coverList.length),
  },
  covers: coverList,
};
await fs.writeFile(COVER_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
await fs.writeFile(REVIEW_PATH, `${JSON.stringify({ generatedAt: output.meta.generatedAt, items: review }, null, 2)}\n`, "utf8");
console.log(JSON.stringify(output.meta));
