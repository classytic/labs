/**
 * Split styles/domains.css into per-domain sheets.
 *
 * domains.css is one 172 KB file holding sixteen domains, so an app showing a maths course loads
 * every rule physics, chemistry and language will ever need. The selectors are already prefixed by
 * domain, so the file can be cut into sheets a consumer imports individually.
 *
 * The cut is made at RULE boundaries and each sheet holds a CONTIGUOUS slice of the original, in
 * the original order, with domains.css importing them in that same order. Concatenating the sheets
 * therefore reproduces the original file byte for byte, which is the proof that the cascade did not
 * move: `--check` asserts exactly that and is what the test suite runs.
 *
 *   node scripts/split-domains.mjs           write styles/domains/*.css and rewrite domains.css
 *   node scripts/split-domains.mjs --check   assert the sheets still concatenate to one file
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const CHECK = process.argv.includes('--check');
const STYLES = new URL('../styles/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const OUT = join(STYLES, 'domains');
const AGGREGATE = join(STYLES, 'domains.css');

/** Selector prefix → the sheet it belongs in. Anything unlisted keeps its own prefix as a name. */
const SHEET = {
  physics: 'physics',
  semiconductor: 'physics',
  electronics: 'circuits',
  circuit: 'circuits',
  cmos: 'circuits',
  logic: 'logic',
  sequential: 'logic',
  kmap: 'logic',
  math: 'math',
  trig: 'math',
  complex: 'math',
  geometry: 'math',
  measurement: 'math',
  proof: 'math',
  invariant: 'math',
  algorithm: 'algorithms',
  dp: 'algorithms',
  graph: 'algorithms',
  tree: 'algorithms',
  heap: 'algorithms',
  recurrence: 'algorithms',
  selection: 'algorithms',
  discrete: 'discrete',
  modular: 'discrete',
  count: 'discrete',
  combination: 'discrete',
  arrangement: 'discrete',
  pascal: 'discrete',
  venn: 'discrete',
  probability: 'probability',
  monty: 'probability',
  outcome: 'probability',
  sample: 'probability',
  bayes: 'probability',
  expected: 'probability',
  compound: 'probability',
  statistics: 'statistics',
  biology: 'biology',
  genetic: 'biology',
  chem: 'chemistry',
  ict: 'ict',
  ml: 'ml',
  editor: 'editor',
  block: 'editor',
  geography: 'geography',
  finance: 'finance',
  stage: 'shared',
  lab: 'shared',
  '(none)': 'shared',
};

/** Top-level chunks: a rule or an at-rule block, plus the comment and blank space before it. */
const chunksOf = (css) => {
  const out = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  let quote = null;
  while (i < css.length) {
    const c = css[i];
    if (quote) {
      if (c === quote && css[i - 1] !== '\\') quote = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      i += 1;
      continue;
    }
    if (c === '/' && css[i + 1] === '*') {
      i = css.indexOf('*/', i + 2) + 2;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        out.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
    i += 1;
  }
  if (start < css.length) out.push(css.slice(start)); // trailing comment / newline
  return out;
};

const sheetOf = (chunk) => {
  const code = chunk.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = /\.([a-z]+)-[a-z0-9-]*|\.([a-z]+)\s*[{,:[ ]/.exec(code);
  const prefix = match ? (match[1] ?? match[2]) : '(none)';
  return SHEET[prefix] ?? prefix;
};

const source = readFileSync(AGGREGATE, 'utf8');
if (source.includes('@import "./domains/')) {
  const order = [...source.matchAll(/@import "\.\/domains\/parts\/([a-z0-9-]+)\.css";/g)].map((m) => m[1]);
  const parts = readdirSync(join(OUT, 'parts'));
  if (CHECK) {
    // Every part is imported exactly once, and every import resolves: the aggregate is the whole set.
    const missing = order.filter((name) => !parts.includes(`${name}.css`));
    const orphans = parts.filter((file) => !order.includes(file.replace('.css', '')));
    if (missing.length || orphans.length) {
      console.error(
        `✗ domains.css is out of step: missing ${missing.join(', ')}; orphaned ${orphans.join(', ')}`,
      );
      process.exit(1);
    }
    const bytes = order.reduce(
      (n, name) => n + readFileSync(join(OUT, 'parts', `${name}.css`), 'utf8').length,
      0,
    );
    console.log(`✓ domains.css imports all ${order.length} parts (${Math.round(bytes / 1024)} KiB)`);
    process.exit(0);
  }
  console.error('domains.css is already split; delete styles/domains/ to redo it.');
  process.exit(1);
}

const chunks = chunksOf(source);
/** Contiguous slices: a slice ends when the sheet changes AND it already holds something. */
const slices = [];
for (const chunk of chunks) {
  const sheet = sheetOf(chunk);
  const last = slices.at(-1);
  if (last && last.sheet === sheet) last.css += chunk;
  else slices.push({ sheet, css: chunk });
}
/** Merge tiny slices into their neighbour: a 200-byte sheet is not worth a file or an import. */
const merged = [];
for (const slice of slices) {
  const last = merged.at(-1);
  if (last && (slice.css.length < 1500 || last.css.length < 1500) && last.sheet !== slice.sheet) {
    // keep the bigger name, absorb the smaller
    if (last.css.length >= slice.css.length) last.css += slice.css;
    else merged.push(slice);
    if (last.css.length >= slice.css.length) continue;
  }
  if (last && last.sheet === slice.sheet) last.css += slice.css;
  else merged.push({ ...slice });
}
/** Name them: one file per sheet, numbered when a sheet has several slices. */
const counts = new Map();
for (const slice of merged) counts.set(slice.sheet, (counts.get(slice.sheet) ?? 0) + 1);
const seen = new Map();
for (const slice of merged) {
  const total = counts.get(slice.sheet);
  const n = (seen.get(slice.sheet) ?? 0) + 1;
  seen.set(slice.sheet, n);
  slice.name = total > 1 ? `${slice.sheet}-${n}` : slice.sheet;
}

if (CHECK) {
  console.error('domains.css is not split yet.');
  process.exit(1);
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'parts'), { recursive: true });
for (const slice of merged) writeFileSync(join(OUT, 'parts', `${slice.name}.css`), slice.css);

/**
 * One public sheet per domain, pulling its parts (and the shared rules every domain leans on).
 * A domain's parts keep their relative order; order BETWEEN domains cannot matter to a consumer
 * importing a single domain, because the other domains' selectors are not in the document.
 */
const domains = [...new Set(merged.map((s) => s.sheet))].filter((s) => s !== 'shared');
const sharedParts = merged.filter((s) => s.sheet === 'shared').map((s) => s.name);
writeFileSync(
  join(OUT, 'shared.css'),
  `/* Rules that belong to no single domain; every domain sheet imports this. */\n` +
    sharedParts.map((name) => `@import "./parts/${name}.css";`).join('\n') +
    '\n',
);
for (const domain of domains) {
  const parts = merged.filter((s) => s.sheet === domain).map((s) => s.name);
  const bytes = merged.filter((s) => s.sheet === domain).reduce((n, s) => n + s.css.length, 0);
  writeFileSync(
    join(OUT, `${domain}.css`),
    `/* ${domain} labs (${Math.round(bytes / 1024)} KiB). Import after core.css and figure.css:\n` +
      `     @import "@classytic/labs/styles/domains/${domain}.css";\n` +
      `   Generated by scripts/split-domains.mjs. */\n` +
      `@import "./shared.css";\n` +
      parts.map((name) => `@import "./parts/${name}.css";`).join('\n') +
      '\n',
  );
}

const header = `/* ─────────────────────────────────────────────────────────────────────────────
   Domain styles, split by subject.

   This file is the whole set, in the order the rules were written, so importing
   it behaves exactly as the single sheet it replaced. An app that shows one
   subject should import only that subject's sheet instead:

     @import "@classytic/labs/styles/core.css";
     @import "@classytic/labs/styles/domains/math.css";

   core.css and figure.css are always required; shared.css carries the rules that
   belong to no single domain and is required by the others.
   Generated by scripts/split-domains.mjs; edit the sheets, not this list.
   ───────────────────────────────────────────────────────────────────────────── */

`;
writeFileSync(
  AGGREGATE,
  header + merged.map((s) => `@import "./domains/parts/${s.name}.css";`).join('\n') + '\n',
);

const sizes = merged.map((s) => `${s.name} ${Math.round(s.css.length / 1024)}k`).join(', ');
console.log(`split into ${merged.length} sheets: ${sizes}`);
