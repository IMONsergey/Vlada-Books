"use client";

import { FormEvent, useMemo, useState } from "react";
import { Icons } from "./icons";
import type { CatalogItem, CatalogResponse, ReadingStatus } from "../../lib/types";

type View = "home" | "library" | "stats" | "collections";

const nav: { id: View; label: string; icon: keyof typeof Icons }[] = [
  { id: "home", label: "Сегодня", icon: "home" },
  { id: "library", label: "Библиотека", icon: "library" },
  { id: "stats", label: "Статистика", icon: "chart" },
  { id: "collections", label: "Подборки", icon: "collection" },
];

const statusLabels: Record<ReadingStatus, string> = {
  owned: "В библиотеке",
  want_to_read: "Хочу прочитать",
  reading: "Читаю",
  read: "Прочитано",
  dnf: "Отложено",
};

const coverPalettes = [
  ["#56353a", "#eadfcf"], ["#183f42", "#e1d5bd"], ["#b76845", "#fff1d6"],
  ["#2f304f", "#e9d9cd"], ["#6f5b38", "#f2e4bf"], ["#364a36", "#e9dec8"],
];

function hash(value: string) {
  return [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
}

function BookCover({ item, compact = false }: { item: CatalogItem; compact?: boolean }) {
  const [background, foreground] = coverPalettes[hash(item.id) % coverPalettes.length];
  // External and owner-uploaded covers intentionally bypass Next's remote image allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  if (item.coverUrl) return <img className="book-cover-image" src={item.coverUrl} alt={`Обложка «${item.title}»`} />;
  return (
    <div className={`book-cover ${compact ? "book-cover--compact" : ""}`} style={{ background, color: foreground }}>
      <span className="book-cover__mark">VB</span>
      <strong>{item.title}</strong>
      <small>{item.primaryAuthor}</small>
    </div>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand__seal">V</span><span>Vlada Books</span></div>
      <div className="topbar__actions">
        <button className="icon-button" aria-label="Поиск" onClick={() => document.getElementById("global-search")?.focus()}><Icons.search /></button>
        <button className="primary-button" onClick={onAdd}><Icons.plus /> Добавить книгу</button>
        <div className="avatar" aria-label="Профиль Влады">В</div>
      </div>
    </header>
  );
}

function Sidebar({ view, onView }: { view: View; onView: (value: View) => void }) {
  return (
    <aside className="sidebar">
      <nav>{nav.map(({ id, label, icon }) => { const Icon = Icons[icon]; return <button key={id} className={view === id ? "active" : ""} onClick={() => onView(id)}><Icon />{label}</button>; })}</nav>
      <div className="sidebar__foot"><span>Личная картотека</span><small>235 произведений · синхронизировано</small></div>
    </aside>
  );
}

function StatCard({ label, value, note, tone = "plain" }: { label: string; value: string | number; note: string; tone?: string }) {
  return <article className={`stat-card stat-card--${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function HomeView({ items, meta, onOpen, onLibrary }: { items: CatalogItem[]; meta: CatalogResponse["meta"]; onOpen: (item: CatalogItem) => void; onLibrary: () => void }) {
  const reading = items.filter((item) => item.status === "reading");
  const spotlight = reading.length ? reading.slice(0, 3) : items.slice(0, 3);
  const genres = useMemo(() => countBy(items, (item) => item.genre).slice(0, 5), [items]);
  const missingAuthor = items.filter((item) => item.primaryAuthor === "Автор не указан").length;
  return (
    <div className="view-stack">
      <section className="welcome-row">
        <div><p className="eyebrow">Понедельник, 24 августа</p><h1>Добро пожаловать домой, Влада.</h1><p>Ваша библиотека в порядке. Здесь — то, что стоит внимания сегодня.</p></div>
        <div className="sync-pill"><span />Все данные сохранены</div>
      </section>
      <section className="stats-grid">
        <StatCard label="Произведений" value={meta.works} note={`${meta.copies} бумажных экземпляров`} tone="wine" />
        <StatCard label="Сейчас читаю" value={reading.length || "—"} note={reading.length ? "активных книг" : "выберите следующую книгу"} />
        <StatCard label="Прочитано в 2026" value={items.filter((item) => item.status === "read").length} note="цель можно настроить" />
        <StatCard label="Данные требуют внимания" value={missingAuthor} note="книг без автора" tone="sand" />
      </section>
      <section>
        <div className="section-heading"><div><p className="eyebrow">На полке</p><h2>{reading.length ? "Продолжить чтение" : "Начните книжную историю"}</h2></div><button className="text-button" onClick={onLibrary}>Вся библиотека <Icons.arrow /></button></div>
        <div className="spotlight-grid">{spotlight.map((item, index) => <button className="spotlight-card" key={item.id} onClick={() => onOpen(item)}><BookCover item={item} /><div><span className="tag">{item.genre}</span><h3>{item.title}</h3><p>{item.primaryAuthor}</p><div className="progress-line"><i style={{ width: `${item.progress || (index + 1) * 12}%` }} /></div><small>{item.progress ? `${item.progress}% прочитано` : "Добавить в чтение"}</small></div></button>)}</div>
      </section>
      <section className="two-column">
        <article className="panel"><div className="section-heading"><div><p className="eyebrow">Состав коллекции</p><h2>Любимые направления</h2></div></div><div className="genre-bars">{genres.map(([label, value]) => <div key={label}><div><span>{label}</span><b>{value}</b></div><i><em style={{ width: `${(value / genres[0][1]) * 100}%` }} /></i></div>)}</div></article>
        <article className="quote-card"><Icons.spark /><p>Картотека уже превращена в живую библиотеку: теперь к каждому изданию можно добавить историю чтения, оценку и заметки.</p><button onClick={onLibrary}>Открыть каталог</button></article>
      </section>
    </div>
  );
}

function LibraryView({ items, onOpen }: { items: CatalogItem[]; onOpen: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("Все жанры");
  const [status, setStatus] = useState<ReadingStatus | "all">("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const genres = useMemo(() => ["Все жанры", ...new Set(items.map((item) => item.genre))], [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const needle = query.toLocaleLowerCase("ru-RU");
    return (!needle || `${item.title} ${item.primaryAuthor} ${item.publisher ?? ""}`.toLocaleLowerCase("ru-RU").includes(needle)) && (genre === "Все жанры" || item.genre === genre) && (status === "all" || item.status === status);
  }), [items, query, genre, status]);
  return (
    <div className="view-stack">
      <section className="page-heading"><div><p className="eyebrow">Полная картотека</p><h1>Моя библиотека</h1><p>{filtered.length} из {items.length} произведений</p></div><div className="layout-switch"><button className={layout === "grid" ? "active" : ""} onClick={() => setLayout("grid")}>Сетка</button><button className={layout === "list" ? "active" : ""} onClick={() => setLayout("list")}>Список</button></div></section>
      <section className="filterbar"><label className="search-field"><Icons.search /><input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, автор или издательство" /></label><select value={genre} onChange={(event) => setGenre(event.target.value)}>{genres.map((value) => <option key={value}>{value}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value as ReadingStatus | "all")}><option value="all">Все статусы</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></section>
      {filtered.length ? <section className={`catalog-${layout}`}>{filtered.map((item) => <button className="catalog-card" key={item.id} onClick={() => onOpen(item)}><BookCover item={item} compact={layout === "list"} /><div className="catalog-card__copy"><span className={`status status--${item.status}`}>{statusLabels[item.status]}</span><h3>{item.title}</h3><p>{item.primaryAuthor}</p><small>{[item.publisher, item.publicationYear].filter(Boolean).join(" · ") || item.genre}</small>{layout === "list" && <span className="catalog-card__genre">{item.genre}</span>}</div></button>)}</section> : <div className="empty-state"><Icons.search /><h2>Ничего не найдено</h2><p>Попробуйте изменить запрос или сбросить фильтры.</p><button onClick={() => { setQuery(""); setGenre("Все жанры"); setStatus("all"); }}>Сбросить фильтры</button></div>}
    </div>
  );
}

function StatsView({ items, meta }: { items: CatalogItem[]; meta: CatalogResponse["meta"] }) {
  const genres = countBy(items, (item) => item.genre).slice(0, 8);
  const publishers = countBy(items.filter((item) => item.publisher), (item) => item.publisher ?? "").slice(0, 7);
  const years = items.map((item) => item.publicationYear).filter((year): year is number => Boolean(year));
  const statuses = Object.entries(statusLabels).map(([key, label]) => [label, items.filter((item) => item.status === key).length] as [string, number]);
  const missing = { author: items.filter((item) => item.primaryAuthor === "Автор не указан").length, year: items.filter((item) => !item.publicationYear).length, publisher: items.filter((item) => !item.publisher).length };
  return <div className="view-stack"><section className="page-heading"><div><p className="eyebrow">Портрет библиотеки</p><h1>Статистика</h1><p>Распределение коллекции и качество данных.</p></div><button className="secondary-button" onClick={() => exportData(items)}><Icons.download />Экспорт JSON</button></section><section className="stats-grid"><StatCard label="Произведений" value={meta.works} note={`${meta.editions} изданий`} tone="wine"/><StatCard label="Экземпляров" value={meta.copies} note={`${meta.copies - meta.works} повторных изданий`}/><StatCard label="Жанров" value={new Set(items.map((item) => item.genre)).size} note="в картотеке"/><StatCard label="Диапазон изданий" value={years.length ? `${Math.min(...years)}—${Math.max(...years)}` : "—"} note="по указанным годам" tone="sand"/></section><section className="analytics-grid"><article className="panel panel--wide"><div className="section-heading"><div><p className="eyebrow">Тематика</p><h2>Жанровый состав</h2></div></div><div className="genre-bars genre-bars--large">{genres.map(([label, value], index) => <div key={label}><div><span>{label}</span><b>{value} · {Math.round(value / items.length * 100)}%</b></div><i><em style={{ width: `${value / genres[0][1] * 100}%`, opacity: 1 - index * .07 }} /></i></div>)}</div></article><article className="panel"><div className="section-heading"><div><p className="eyebrow">Статусы</p><h2>История чтения</h2></div></div><div className="donut-wrap"><div className="donut" style={{ "--read": `${Math.max(1, statuses.find(([label]) => label === "Прочитано")?.[1] ?? 0)}%` } as React.CSSProperties}><span>{items.filter((item) => item.status === "read").length}<small>прочитано</small></span></div><ul>{statuses.map(([label, value]) => <li key={label}><span>{label}</span><b>{value}</b></li>)}</ul></div></article><article className="panel"><div className="section-heading"><div><p className="eyebrow">Издательства</p><h2>Топ в коллекции</h2></div></div><ol className="rank-list">{publishers.map(([label, value], index) => <li key={label}><span>{index + 1}</span><p>{label}</p><b>{value}</b></li>)}</ol></article><article className="panel data-health"><div className="section-heading"><div><p className="eyebrow">Качество данных</p><h2>Что дополнить</h2></div></div><div><strong>{Math.round((1 - (missing.author + missing.year + missing.publisher) / (items.length * 3)) * 100)}%</strong><span>карточек заполнено</span></div><ul><li><span>Без автора</span><b>{missing.author}</b></li><li><span>Без года</span><b>{missing.year}</b></li><li><span>Без издательства</span><b>{missing.publisher}</b></li></ul></article></section></div>;
}

function CollectionsView({ items, onOpen }: { items: CatalogItem[]; onOpen: (item: CatalogItem) => void }) {
  const groups = [
    { name: "Для долгих вечеров", description: "Классика и большие романы", filter: (item: CatalogItem) => /классика|роман/i.test(item.genre) },
    { name: "Мода и стиль", description: "История костюма, дизайнеры, дома моды", filter: (item: CatalogItem) => /мод|дизайн/i.test(`${item.title} ${item.genre}`) },
    { name: "Семейная полка", description: "Книги для чтения вместе", filter: (item: CatalogItem) => /дет/i.test(item.genre) },
  ];
  return <div className="view-stack"><section className="page-heading"><div><p className="eyebrow">Тематические полки</p><h1>Подборки</h1><p>Быстрый путь к нужному настроению.</p></div><button className="secondary-button"><Icons.plus />Новая подборка</button></section><section className="collections-grid">{groups.map((group, index) => { const books = items.filter(group.filter).slice(0, 4); return <article className={`collection-card collection-card--${index + 1}`} key={group.name}><div><span>{books.length} книг</span><h2>{group.name}</h2><p>{group.description}</p></div><div className="mini-shelf">{books.map((book) => <button key={book.id} onClick={() => onOpen(book)} aria-label={book.title}><BookCover item={book} compact /></button>)}</div></article>; })}</section></div>;
}

function BookDrawer({ item, onClose, onSave }: { item: CatalogItem; onClose: () => void; onSave: (item: CatalogItem) => void }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  async function save() { setSaving(true); onSave(draft); try { await fetch(`/api/reading/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: draft.status, progress: draft.progress, rating: draft.rating, notes: draft.notes }) }); } finally { setSaving(false); onClose(); } }
  return <div className="modal-shell" role="dialog" aria-modal="true" aria-label={`Карточка книги ${item.title}`}><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть"/><aside className="drawer"><button className="drawer__close" onClick={onClose}><Icons.close /></button><div className="drawer__hero"><BookCover item={item}/><div><span className="tag">{item.genre}</span><h2>{item.title}</h2><p>{item.primaryAuthor}</p><dl><div><dt>Издательство</dt><dd>{item.publisher || "Не указано"}</dd></div><div><dt>Год</dt><dd>{item.publicationYear || "—"}</dd></div><div><dt>Экземпляры</dt><dd>{item.copies}</dd></div></dl></div></div><div className="drawer__form"><label>Статус<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ReadingStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Прогресс <b>{draft.progress}%</b><input type="range" min="0" max="100" value={draft.progress} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value), status: Number(event.target.value) === 100 ? "read" : Number(event.target.value) > 0 ? "reading" : draft.status })}/></label><fieldset><legend>Моя оценка</legend><div className="rating">{[1,2,3,4,5].map((value) => <button key={value} className={(draft.rating ?? 0) >= value ? "active" : ""} onClick={() => setDraft({ ...draft, rating: value })}>★</button>)}</div></fieldset><label>Заметки<textarea rows={4} placeholder="Впечатления, цитаты, мысли…" value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })}/></label><button className="primary-button primary-button--full" onClick={save} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить изменения"}</button></div></aside></div>;
}

function AddBookModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", primaryAuthor: "", genre: "", publisher: "", publicationYear: "" });
  const [saving, setSaving] = useState(false);
  const [lookup, setLookup] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; primaryAuthor: string; publicationYear: number | null; publisher: string | null; coverUrl: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  async function searchMetadata() {
    if (lookup.trim().length < 2) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(lookup)}`);
      const data = await response.json() as { results?: typeof results };
      setResults(data.results ?? []);
    } finally { setSearching(false); }
  }
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); try { const response = await fetch("/api/books", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, publicationYear: form.publicationYear ? Number(form.publicationYear) : null }) }); if (!response.ok) throw new Error(); onCreated(); onClose(); } catch { setSaving(false); } }
  return <div className="modal-shell" role="dialog" aria-modal="true" aria-label="Добавить книгу"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть"/><div className="dialog"><button className="drawer__close" onClick={onClose}><Icons.close /></button><p className="eyebrow">Новая карточка</p><h2>Добавить книгу</h2><p>Найдите метаданные онлайн или заполните карточку вручную.</p><div className="metadata-search"><input autoFocus placeholder="Название или ISBN" value={lookup} onChange={(event) => setLookup(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchMetadata(); } }}/><button type="button" onClick={searchMetadata}>{searching ? "Ищем…" : "Найти"}</button></div>{results.length > 0 && <div className="metadata-results">{results.slice(0, 4).map((result) => <button key={result.id} type="button" onClick={() => { setForm({ ...form, title: result.title, primaryAuthor: result.primaryAuthor, publicationYear: result.publicationYear?.toString() ?? "", publisher: result.publisher ?? "" }); setResults([]); }}><span>{result.title}</span><small>{result.primaryAuthor}{result.publicationYear ? ` · ${result.publicationYear}` : ""}</small></button>)}</div>}<div className="form-divider"><span>Карточка издания</span></div><form onSubmit={submit}><label>Название *<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label><label>Автор<input value={form.primaryAuthor} onChange={(event) => setForm({ ...form, primaryAuthor: event.target.value })}/></label><div className="form-row"><label>Жанр<input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })}/></label><label>Год<input type="number" min="1400" max="2100" value={form.publicationYear} onChange={(event) => setForm({ ...form, publicationYear: event.target.value })}/></label></div><label>Издательство<input value={form.publisher} onChange={(event) => setForm({ ...form, publisher: event.target.value })}/></label><button className="primary-button primary-button--full" disabled={saving}>{saving ? "Добавляем…" : "Добавить в библиотеку"}</button></form></div></div>;
}

export function LibraryApp({ initial }: { initial: CatalogResponse }) {
  const [view, setView] = useState<View>("home");
  const [items, setItems] = useState(initial.items);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [adding, setAdding] = useState(false);
  function refresh() { fetch("/api/catalog").then((response) => response.ok ? response.json() : null).then((data: CatalogResponse | null) => data && setItems(data.items)).catch(() => undefined); }
  return <div className="app-shell"><Header onAdd={() => setAdding(true)}/><Sidebar view={view} onView={setView}/><main className="main-content">{view === "home" && <HomeView items={items} meta={initial.meta} onOpen={setSelected} onLibrary={() => setView("library")}/>} {view === "library" && <LibraryView items={items} onOpen={setSelected}/>} {view === "stats" && <StatsView items={items} meta={initial.meta}/>} {view === "collections" && <CollectionsView items={items} onOpen={setSelected}/>}</main><nav className="mobile-nav">{nav.map(({ id, label, icon }) => { const Icon = Icons[icon]; return <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon/><span>{label}</span></button>; })}</nav>{selected && <BookDrawer item={selected} onClose={() => setSelected(null)} onSave={(updated) => setItems(items.map((item) => item.id === updated.id ? updated : item))}/>} {adding && <AddBookModal onClose={() => setAdding(false)} onCreated={refresh}/>}</div>;
}

function countBy<T>(items: T[], key: (item: T) => string): [string, number][] { const map = new Map<string, number>(); for (const item of items) { const value = key(item); if (value) map.set(value, (map.get(value) ?? 0) + 1); } return [...map.entries()].sort((a, b) => b[1] - a[1]); }
function exportData(items: CatalogItem[]) { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), items }, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "vlada-books-export.json"; link.click(); URL.revokeObjectURL(link.href); }
