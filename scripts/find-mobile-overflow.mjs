/**
 * Drawing surfaces that can be wider than a phone.
 *
 * `<Stage>` is now bounded by `.stage-canvas { max-width: 100% }`, so anything drawing through it
 * is safe. But 96 files render a raw `<svg>` of their own, and a raw SVG carrying a fixed pixel
 * `width` with no bound overflows a 360px screen exactly the way Stage used to: the page scrolls
 * sideways and there is no ResizeObserver coming later to rescue it.
 *
 * A raw SVG is safe when it either sets a percentage/auto width, or is covered by a stylesheet
 * rule that bounds it. This reports the ones that are neither, so the list is worth triaging
 * rather than being a wall of false alarms.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.tsx')) files.push(path.replace(/\\/g, '/'));
  }
})('src');

/** Class names our stylesheets already bound with a max-width. */
const bounded = new Set();
for (const sheet of [
  'styles/core.css',
  'styles/domains.css',
  'styles/commerce.css',
  'styles/figure.css',
  'styles/three.css',
  'styles/exam.css',
  'styles/modern-physics.css',
]) {
  let css = '';
  try {
    css = readFileSync(sheet, 'utf8');
  } catch {
    continue;
  }
  // Any rule block that sets max-width: 100% binds every class named in its selector.
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/max-width:\s*100%/.test(m[2])) continue;
    for (const cls of m[1].matchAll(/\.([a-zA-Z0-9_-]+)/g)) bounded.add(cls[1]);
  }
}

const risky = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const tag of src.matchAll(/<svg\b[^>]*>/g)) {
    const open = tag[0];
    if (/<Stage/.test(open)) continue;
    // A percentage or auto width scales with the container already.
    if (/width\s*=\s*[{"']?\s*['"]?(100%|auto)/.test(open)) continue;
    if (/style=\{\{[^}]*(maxWidth|width:\s*'100%')/.test(open)) continue;
    const cls = open.match(/className\s*=\s*["']([^"']+)["']/)?.[1] ?? '';
    if (cls.split(/\s+/).some((c) => bounded.has(c))) continue;
    // Only a FIXED pixel width can overflow; a viewBox-only svg scales.
    if (!/width\s*=\s*\{?\s*['"]?\d/.test(open) && !/width\s*=\s*\{[a-zA-Z_$]/.test(open)) continue;
    risky.push({ file, cls, open: open.slice(0, 110) });
  }
}

const byFile = new Map();
for (const r of risky) byFile.set(r.file, (byFile.get(r.file) ?? 0) + 1);
for (const [file, n] of [...byFile].sort((a, b) => b[1] - a[1])) console.log(`${n}  ${file}`);
console.log(`\n${byFile.size} file(s) render a fixed-width SVG that nothing bounds.`);
console.log(`classes already bounded by a stylesheet: ${[...bounded].sort().join(', ') || '(none)'}`);
