import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const works = sqliteTable(
  "works",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    sortTitle: text("sort_title").notNull(),
    primaryAuthor: text("primary_author").notNull(),
    genre: text("genre").notNull().default("Без жанра"),
    mediaType: text("media_type").notNull().default("book"),
    description: text("description"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("works_sort_title_idx").on(table.sortTitle),
    index("works_author_idx").on(table.primaryAuthor),
    index("works_genre_idx").on(table.genre),
  ],
);

export const contributors = sqliteTable(
  "contributors",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    sortName: text("sort_name").notNull(),
  },
  (table) => [uniqueIndex("contributors_sort_name_uidx").on(table.sortName)],
);

export const workContributors = sqliteTable(
  "work_contributors",
  {
    workId: text("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    contributorId: text("contributor_id")
      .notNull()
      .references(() => contributors.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("author"),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.workId, table.contributorId, table.role] }),
    index("work_contributors_work_idx").on(table.workId),
  ],
);

export const editions = sqliteTable(
  "editions",
  {
    id: text("id").primaryKey(),
    workId: text("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    publisher: text("publisher"),
    publicationYear: integer("publication_year"),
    illustrator: text("illustrator"),
    language: text("language").notNull().default("ru"),
    features: text("features"),
    format: text("format").notNull().default("hardcopy"),
    isbn10: text("isbn_10"),
    isbn13: text("isbn_13"),
    pages: integer("pages"),
    coverKey: text("cover_key"),
    coverUrl: text("cover_url"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("editions_work_idx").on(table.workId),
    index("editions_isbn13_idx").on(table.isbn13),
    index("editions_publisher_idx").on(table.publisher),
  ],
);

export const copies = sqliteTable(
  "copies",
  {
    id: text("id").primaryKey(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    sourceRow: integer("source_row"),
    ownershipStatus: text("ownership_status").notNull().default("owned"),
    location: text("location"),
    condition: text("condition"),
    acquiredAt: text("acquired_at"),
    acquiredFrom: text("acquired_from"),
    purchasePrice: real("purchase_price"),
    isGift: integer("is_gift", { mode: "boolean" }).notNull().default(false),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("copies_edition_idx").on(table.editionId),
    index("copies_location_idx").on(table.location),
  ],
);

export const readingAttempts = sqliteTable(
  "reading_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workId: text("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("owned"),
    progress: integer("progress").notNull().default(0),
    currentPage: integer("current_page"),
    rating: real("rating"),
    startedAt: text("started_at"),
    finishedAt: text("finished_at"),
    notes: text("notes"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("reading_attempts_work_idx").on(table.workId),
    index("reading_attempts_status_idx").on(table.status),
    index("reading_attempts_finished_idx").on(table.finishedAt),
  ],
);

export const progressEvents = sqliteTable(
  "progress_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attemptId: integer("attempt_id")
      .notNull()
      .references(() => readingAttempts.id, { onDelete: "cascade" }),
    progress: integer("progress").notNull(),
    page: integer("page"),
    minutes: integer("minutes"),
    note: text("note"),
    occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("progress_events_attempt_idx").on(table.attemptId)],
);

export const collections = sqliteTable(
  "collections",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("collections_name_uidx").on(table.name)],
);

export const collectionItems = sqliteTable(
  "collection_items",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    workId: text("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    addedAt: text("added_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.workId] })],
);

export const readingGoals = sqliteTable(
  "reading_goals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(),
    targetBooks: integer("target_books").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("reading_goals_year_uidx").on(table.year)],
);
