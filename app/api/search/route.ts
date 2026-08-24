export const dynamic = "force-dynamic";

type OpenLibraryDocument = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  publisher?: string[];
  isbn?: string[];
  cover_i?: number;
  language?: string[];
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return Response.json({ results: [] });

  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "8");
    url.searchParams.set("fields", "key,title,author_name,first_publish_year,publisher,isbn,cover_i,language");
    const response = await fetch(url, {
      headers: { "user-agent": "VladaBooks/1.0 (personal-library-app)" },
    });
    if (!response.ok) throw new Error("Источник метаданных временно недоступен");
    const data = (await response.json()) as { docs?: OpenLibraryDocument[] };
    const results = (data.docs ?? []).map((document) => ({
      id: document.key,
      title: document.title ?? "Без названия",
      primaryAuthor: document.author_name?.join(", ") ?? "Автор не указан",
      publicationYear: document.first_publish_year ?? null,
      publisher: document.publisher?.[0] ?? null,
      isbn13: document.isbn?.find((isbn) => isbn.length === 13) ?? null,
      language: document.language?.includes("rus") ? "ru" : document.language?.[0] ?? "ru",
      coverUrl: document.cover_i
        ? `https://covers.openlibrary.org/b/id/${document.cover_i}-L.jpg`
        : null,
    }));
    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Поиск не выполнен";
    return Response.json({ error: message, results: [] }, { status: 502 });
  }
}
