import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("contains the Vlada Books application shell", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /LibraryApp/);
  assert.match(layout, /Vlada Books/);
  assert.match(layout, /личная библиотека/i);
});
