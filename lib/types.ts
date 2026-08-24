export type ReadingStatus =
  | "owned"
  | "want_to_read"
  | "reading"
  | "read"
  | "dnf";

export type CatalogItem = {
  id: string;
  title: string;
  primaryAuthor: string;
  genre: string;
  mediaType: string;
  editionId: string;
  publisher: string | null;
  publicationYear: number | null;
  illustrator: string | null;
  language: string;
  features: string | null;
  format: string;
  coverUrl: string | null;
  coverKey: string | null;
  pages: number | null;
  copies: number;
  status: ReadingStatus;
  progress: number;
  rating: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  notes: string | null;
};

export type CatalogResponse = {
  items: CatalogItem[];
  source: "database" | "seed";
  meta: {
    works: number;
    editions: number;
    copies: number;
  };
};
