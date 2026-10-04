/*
 * Regenerates js/core/icons.js from the Simple Icons package (CC0-1.0).
 *
 * Usage:
 *   npm install --no-save simple-icons
 *   node tools/build-icons.mjs
 *
 * Only the slugs referenced by js/core/catalog.js are embedded, so the app
 * stays small and works fully offline.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = path.join(root, 'node_modules', 'simple-icons');

await import(path.join(root, 'js/core/catalog.js'));
const { ITEMS } = globalThis.ST.catalog;

const pkg = JSON.parse(await readFile(path.join(pkgDir, 'package.json'), 'utf8'));
const data = JSON.parse(await readFile(path.join(pkgDir, 'data/simple-icons.json'), 'utf8'));
const hexBySlug = new Map(data.map((d) => [d.slug, d.hex]));

const slugs = [...new Set(ITEMS.map((i) => i.icon).filter(Boolean))].sort();
const out = {};
const missing = [];
for (const slug of slugs) {
  let svg;
  try {
    svg = await readFile(path.join(pkgDir, 'icons', `${slug}.svg`), 'utf8');
  } catch {
    missing.push(slug);
    continue;
  }
  const d = svg.match(/<path d="([^"]+)"/)?.[1];
  if (!d) {
    missing.push(slug);
    continue;
  }
  out[slug] = { p: d, h: hexBySlug.get(slug) || null };
}

if (missing.length) {
  console.error(`Missing icons: ${missing.join(', ')}`);
  process.exitCode = 1;
}

const body = `/*
 * GENERATED FILE - do not edit by hand. Run: node tools/build-icons.mjs
 * Brand icons from Simple Icons v${pkg.version} (https://simpleicons.org), CC0-1.0.
 * All brand names and logos are trademarks of their respective owners.
 */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});
  ST.icons = ${JSON.stringify(out, null, 2)};
})(typeof self !== 'undefined' ? self : globalThis);
`;
await writeFile(path.join(root, 'js/core/icons.js'), body);
console.log(`Wrote ${Object.keys(out).length} icons.`);
