/**
 * Chip rows built with `.map()`, which `find-mode-rows.mjs` under-counts.
 *
 * That script counts static `<Chip` tags, so a row rendered from a list has exactly one and
 * reads as a single-chip ACTION row. Those rows are usually one-of-N mode switchers, and they
 * would regress silently the moment the legacy `:has()` rule is deleted. Run this before
 * removing it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  }
})('src');

const hits = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('<Chip')) continue;
  for (const m of src.matchAll(/<(?:span|div) className="lab-field-row"[^>]*>([\s\S]*?)<\/(?:span|div)>/g)) {
    const body = m[1];
    if (!body.includes('<Chip') || !body.includes('.map(')) continue;
    const chips = (body.match(/<Chip/g) ?? []).length;
    hits.push({
      file: file.split('\\').join('/'),
      chips,
      snippet: body.trim().slice(0, 70).replace(/\s+/g, ' '),
    });
  }
}

console.log(`mapped chip rows: ${hits.length}`);
for (const h of hits) console.log(`  ${h.file}  static<Chip>=${h.chips}  ${h.snippet}…`);
