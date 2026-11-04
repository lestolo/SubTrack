/*
 * Regenerates icons/brands/*.svg and icons/brands/NOTICE.md from the logo
 * sources listed in js/core/catalog.js.
 *
 * Usage:
 *   npm run logos
 * which installs the icon sets and svgo without saving them, then runs this
 * script.
 *
 * Each catalogue entry names its logo source as either:
 * - "<set>:<icon>", e.g. "thesvg-color:netflix": an icon of an Iconify set
 *   (only the set's JSON data is read);
 * - "wikimedia:<file name>", e.g. "wikimedia:Calm_(company)_logo.svg": a file
 *   on Wikimedia Commons, which only hosts freely licensed or public-domain
 *   files. It is downloaded once (cached in node_modules/.cache) and optimised
 *   with svgo.
 * Every logo is bundled locally, so the app keeps working offline and makes no
 * network requests.
 */
import { readFile, writeFile, readdir, mkdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'icons', 'brands');

await import(path.join(root, 'js/core/catalog.js'));
const { ITEMS } = globalThis.ST.catalog;

const sets = new Map();
async function loadSet(prefix) {
  if (sets.has(prefix)) return sets.get(prefix);
  const dir = path.join(root, 'node_modules', '@iconify-json', prefix);
  let data, info, pkg;
  try {
    data = JSON.parse(await readFile(path.join(dir, 'icons.json'), 'utf8'));
    info = JSON.parse(await readFile(path.join(dir, 'info.json'), 'utf8'));
    pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  } catch {
    throw new Error(`Icon set "${prefix}" not found: run npm install --no-save @iconify-json/${prefix}`);
  }
  const set = { data, info, version: pkg.version };
  sets.set(prefix, set);
  return set;
}

function resolve(data, name) {
  const aliases = data.aliases || {};
  for (let i = 0; i < 10; i++) {
    if (data.icons[name]) return data.icons[name];
    const alias = aliases[name];
    if (!alias) return null;
    const transforms = Object.keys(alias).filter((k) => k !== 'parent');
    if (transforms.length) throw new Error(`alias "${name}" uses transforms (${transforms}), not supported`);
    name = alias.parent;
  }
  return null;
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';
const cacheDir = path.join(root, 'node_modules', '.cache', 'subtrack-logos');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Downloads a Wikimedia Commons file (cached), retrying when rate-limited. */
async function fetchCommons(file) {
  const cached = path.join(cacheDir, file);
  try {
    return await readFile(cached, 'utf8');
  } catch { /* not cached yet */ }
  const md5 = createHash('md5').update(file).digest('hex');
  const url = `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0, 2)}/${encodeURIComponent(file)}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'SubTrack-build-logos/1.0 (https://github.com/lestolo/SubTrack)' } });
    if (res.status === 429) {
      await sleep(5000 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`${file}: HTTP ${res.status} from ${url}`);
    const text = await res.text();
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cached, text);
    return text;
  }
  throw new Error(`${file}: still rate-limited by Wikimedia, try again later`);
}

function cleanSvg(raw, id) {
  const { data } = optimize(raw, {
    multipass: true,
    plugins: ['preset-default', 'removeDimensions', 'removeXlink', { name: 'prefixIds', params: { prefix: id } }],
  });
  if (!/^<svg[^>]*\sviewBox="/.test(data)) throw new Error(`${id}: logo has no viewBox`);
  return `${data}\n`;
}

// Logos are shown with <img>, where SVG scripts never run, but reject anything
// active or external anyway so the files are safe to open on their own too.
const UNSAFE = /<script|<foreignObject|<iframe|<image|\son\w+\s*=|javascript:|(?:href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)/i;

const files = new Map();
const missing = [];
for (const item of ITEMS) {
  if (!item.logo) continue;
  const [prefix, name, extra] = item.logo.split(':');
  if (!prefix || !name || extra !== undefined) throw new Error(`${item.id}: invalid logo source "${item.logo}"`);
  if (prefix === 'wikimedia') {
    const svg = cleanSvg(await fetchCommons(name), item.id);
    if (UNSAFE.test(svg)) throw new Error(`${item.id}: unsafe content in ${item.logo}`);
    files.set(`${item.id}.svg`, { svg, item, prefix, name });
    continue;
  }
  const set = await loadSet(prefix);
  const icon = resolve(set.data, name);
  if (!icon) {
    missing.push(`${item.id} (${item.logo})`);
    continue;
  }
  const { data } = set;
  const left = icon.left ?? data.left ?? 0;
  const top = icon.top ?? data.top ?? 0;
  const width = icon.width ?? data.width ?? 16;
  const height = icon.height ?? data.height ?? 16;
  const body = icon.body.replace(/\s*\n\s*/g, ' ').trim();
  if (UNSAFE.test(body)) throw new Error(`${item.id}: unsafe content in ${item.logo}`);
  const xlink = body.includes('xlink:') ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"${xlink} viewBox="${left} ${top} ${width} ${height}">${body}</svg>\n`;
  files.set(`${item.id}.svg`, { svg, item, prefix, name });
}

if (missing.length) {
  console.error(`Missing logos: ${missing.join(', ')}`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
for (const f of await readdir(outDir)) {
  if (f.endsWith('.svg') && !files.has(f)) await unlink(path.join(outDir, f));
}
for (const [f, { svg }] of files) await writeFile(path.join(outDir, f), svg);

const setRows = [...sets].sort(([a], [b]) => a.localeCompare(b)).map(([prefix, s]) => {
  const author = s.info.author || {};
  const license = s.info.license || {};
  return `| \`${prefix}\` | [${author.name || prefix}](${author.url || ''}) | [${license.title || license.spdx}](${license.url || ''}) | \`@iconify-json/${prefix}@${s.version}\` |`;
});
if ([...files.values()].some((f) => f.prefix === 'wikimedia')) {
  setRows.push('| `wikimedia` | [Wikimedia Commons](https://commons.wikimedia.org) | Free licence or public domain: see each file page below | Downloaded, optimised with svgo |');
}
const logoRows = [...files.values()]
  .sort((a, b) => a.item.name.localeCompare(b.item.name, 'en'))
  .map(({ item, prefix, name }) => `| ${item.name} | \`${item.id}.svg\` | ${prefix === 'wikimedia'
    ? `[Commons: ${name}](${COMMONS}${encodeURIComponent(name)})`
    : `\`${prefix}:${name}\``} |`);

const notice = `<!-- GENERATED FILE - do not edit by hand. Run: npm run logos -->
# Brand logos

The SVG files in this folder are logos of third-party services. **They are not
covered by the MIT License of SubTrack.**

- All product names, logos and brands are trademarks or registered trademarks of
  their respective owners. They are used only to identify the services a user
  subscribes to. Their use does not imply any affiliation with or endorsement by
  the owners.
- The files come from the icon collections below, distributed through
  [Iconify](https://iconify.design) (taken unmodified, apart from wrapping them
  in an \`<svg>\` root), and from [Wikimedia Commons](https://commons.wikimedia.org)
  (optimised with svgo, drawing unchanged). The licence of each source covers
  the drawing of the logo, not the trademark it depicts.
- If you own one of these trademarks and want its logo removed, please
  [open an issue](https://github.com/lestolo/SubTrack/issues): it will be removed
  and the app will show a coloured monogram instead.

## Sources

| Set | Author | Licence | Package |
| --- | --- | --- | --- |
${setRows.join('\n')}

## Files

| Service | File | Source |
| --- | --- | --- |
${logoRows.join('\n')}
`;
await writeFile(path.join(outDir, 'NOTICE.md'), notice);
console.log(`Wrote ${files.size} logos.`);
