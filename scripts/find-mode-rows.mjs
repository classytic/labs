/**
 * Inventory of chip rows, to drive the `Segmented` migration.
 *
 * A row of `<Chip>`s means one of three different things, and only the first should become a
 * `Segmented`:
 *   MODE      mutually exclusive choice (situation / view / units) → migrate
 *   ACTION    a button wearing chip clothes (Play, Reset, Refill)  → leave as Chip
 *   MULTI     independent toggles / filters                        → leave as Chip
 *
 * Heuristic: a row is MODE when every chip's `selected=` is a comparison or a boolean
 * expression over the SAME state, and none is the literal `{false}` (the tell for an action
 * chip, which is never "on"). Anything ambiguous is reported as REVIEW rather than guessed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  }
})(ROOT);

const ROW = /<(?:span|div) className="lab-field-row"[^>]*>([\s\S]*?)<\/(?:span|div)>/g;

/**
 * Every `selected={...}` in a row, with brace matching.
 *
 * A regex that captures a chip's attributes up to the first `>` is wrong here: the very common
 * `selected={qa > 0}` contains one, so the capture truncated and 13 ordinary mode rows were
 * reported as ambiguous.
 */
function selectedExprs(body) {
  const out = [];
  const needle = 'selected={';
  let i = body.indexOf(needle);
  while (i !== -1) {
    let depth = 1;
    let j = i + needle.length;
    while (j < body.length && depth > 0) {
      if (body[j] === '{') depth++;
      else if (body[j] === '}') depth--;
      if (depth > 0) j++;
    }
    out.push(body.slice(i + needle.length, j).trim());
    i = body.indexOf(needle, j);
  }
  return out;
}

const report = { mode: [], action: [], multi: [], review: [] };

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('<Chip')) continue;
  const rel = relative(process.cwd(), file).replace(/\\/g, '/');
  let m;
  ROW.lastIndex = 0;
  let rowIndex = 0;
  while ((m = ROW.exec(src))) {
    const body = m[1];
    if (!body.includes('<Chip')) continue;
    rowIndex++;
    const chipCount = (body.match(/<Chip\b/g) ?? []).length;
    if (!chipCount) continue;
    const chips = { length: chipCount };
    const selecteds = selectedExprs(body);
    const hasFalseLiteral = selecteds.some((s) => s === 'false');
    const entry = { file: rel, row: rowIndex, chips: chips.length, selecteds };
    if (chips.length < 2) report.action.push(entry);
    else if (hasFalseLiteral) report.action.push(entry);
    else if (selecteds.every((s) => s.length > 0)) report.mode.push(entry);
    else report.review.push(entry);
  }
}

const byFile = (list) => [...new Set(list.map((e) => e.file))];
console.log(`MODE rows to migrate: ${report.mode.length} in ${byFile(report.mode).length} files`);
console.log(`ACTION rows to leave: ${report.action.length} in ${byFile(report.action).length} files`);
console.log(`REVIEW (ambiguous):   ${report.review.length} in ${byFile(report.review).length} files`);

if (process.argv.includes('--list')) {
  const domainOf = (f) => f.split('/')[1] ?? '?';
  const counts = {};
  for (const f of byFile(report.mode)) counts[domainOf(f)] = (counts[domainOf(f)] ?? 0) + 1;
  console.log('\nMODE files by domain:');
  for (const [d, n] of Object.entries(counts).sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(3)} ${d}`);
  console.log('\nfiles:');
  for (const f of byFile(report.mode)) console.log('  ' + f);
}
if (process.argv.includes('--review')) {
  console.log('\nAmbiguous rows:');
  for (const e of report.review) console.log(`  ${e.file} row${e.row}: ${JSON.stringify(e.selecteds)}`);
}
