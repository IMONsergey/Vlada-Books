import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: generate-catalog-seed.mjs <input.xlsx> <output.json>");
}

const clean = (value) => (value == null ? "" : String(value).trim());
const normalize = (value) =>
  clean(value)
    .toLocaleLowerCase("ru-RU")
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
const slug = (value) =>
  normalize(value)
    .replace(/[а-я]/gi, (letter) =>
      ({ а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" })[letter.toLowerCase()] ?? letter,
    )
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52) || "item";

const file = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(file);
const sheet = workbook.worksheets.getItemAt(0);
const rows = sheet.getUsedRange().values.slice(4).map((row, index) => ({
  sourceRow: index + 5,
  author: clean(row[0]),
  title: clean(row[1]),
  publisher: clean(row[2]),
  publicationYear: row[3] == null || row[3] === "" ? null : Number(row[3]),
  illustrator: clean(row[4]),
  genre: clean(row[5]),
  features: clean(row[6]),
})).filter((row) => row.title);

const works = [];
const editions = [];
const copies = [];
const contributors = [];
const workContributors = [];
const workByKey = new Map();
const contributorByKey = new Map();

for (const row of rows) {
  const primaryAuthor = row.author || "Автор не указан";
  const workKey = `${normalize(row.title)}|${normalize(primaryAuthor)}`;
  let workId = workByKey.get(workKey);
  if (!workId) {
    workId = `work-${String(works.length + 1).padStart(3, "0")}-${slug(row.title)}`;
    workByKey.set(workKey, workId);
    works.push({
      id: workId,
      title: row.title,
      sortTitle: normalize(row.title),
      primaryAuthor,
      genre: row.genre || "Без жанра",
      mediaType: row.genre === "Журнал" ? "magazine" : "book",
      createdAt: "2026-08-24T00:00:00.000Z",
    });

    const authorNames = row.author
      ? row.author.split(/[;/]/).map(clean).filter(Boolean)
      : ["Автор не указан"];
    for (const [position, name] of authorNames.entries()) {
      const contributorKey = normalize(name);
      let contributorId = contributorByKey.get(contributorKey);
      if (!contributorId) {
        contributorId = `person-${String(contributors.length + 1).padStart(3, "0")}-${slug(name)}`;
        contributorByKey.set(contributorKey, contributorId);
        contributors.push({ id: contributorId, name, sortName: contributorKey });
      }
      workContributors.push({ workId, contributorId, role: "author", position });
    }
  }

  const editionId = `edition-${String(editions.length + 1).padStart(3, "0")}`;
  const language = /английск/i.test(row.features) ? "en" : "ru";
  editions.push({
    id: editionId,
    workId,
    publisher: row.publisher || null,
    publicationYear: Number.isFinite(row.publicationYear) ? row.publicationYear : null,
    illustrator: row.illustrator || null,
    language,
    features: row.features || null,
    format: row.genre === "Журнал" ? "magazine" : "hardcopy",
    coverUrl: null,
  });
  copies.push({
    id: `copy-${String(copies.length + 1).padStart(3, "0")}`,
    editionId,
    sourceRow: row.sourceRow,
    ownershipStatus: "owned",
    location: null,
    createdAt: "2026-08-24T00:00:00.000Z",
  });
}

const payload = {
  meta: {
    source: "knizhnaya_kartoteka.xlsx",
    importedAt: "2026-08-24T00:00:00.000Z",
    sourceRows: rows.length,
    workCount: works.length,
    editionCount: editions.length,
    copyCount: copies.length,
  },
  works,
  editions,
  copies,
  contributors,
  workContributors,
};

await fs.mkdir(new URL(".", `file://${outputPath}`).pathname, { recursive: true }).catch(() => {});
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify(payload.meta));
