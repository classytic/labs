/**
 * How many ways does this package actually teach?
 *
 * Every other gate here measures whether a lab is CORRECT: no collisions, no overflow, exports
 * resolve, budgets hold. None of them measures whether it is DIFFERENT, and that turns out to be
 * the thing that went wrong. 290 labs, 290 distinct figures, and behind them one lesson shape:
 * predict, act, observe, explain, transfer, with a multiple-choice question at the gate. 108 of
 * the 116 labs that declare a predict phase run all five beats. 257 authored questions are
 * choices; 13 are anything else.
 *
 * That is not because the kit is short of ideas. SlotFill exists and is used by five labs.
 * RuleCard by nine. PredictGate, SortBoard and useGuide by none at all. The kit keeps growing
 * interactions and the catalogue keeps reaching for the same one, because nothing ever counted.
 * This counts.
 *
 * A verb here is what the LEARNER does to commit an answer, which is the thing they remember
 * doing. Picking from three options is one verb. Placing a tile, ordering steps, building a
 * structure, sorting cases and writing a reason are others, and they suit different material:
 * you cannot learn to construct a proof by picking it from a list.
 *
 *   node scripts/teaching-variety.mjs            report
 *   node scripts/teaching-variety.mjs --domain math
 *   node scripts/teaching-variety.mjs --strict   fail if a domain teaches only one way
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/', import.meta.url));
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const only = args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null;

/** What the learner DOES to commit, in the order we prefer to detect it. */
const VERBS = [
  ['choose', /choices:\s*\[|AssessedChoiceGroup|kind:\s*'choice'/],
  ['place', /useSlotFill|<SlotFill|<Blank\b|SlotTray/],
  ['order', /kind:\s*'ordering'|SortBoard|reorder/i],
  ['compute', /kind:\s*'numeric'|tolerance:/],
  ['name', /kind:\s*'text'\b/],
  ['explain', /kind:\s*'reflection'|rubric:\s*\[/],
  ['build', /pattern:\s*'construction'|CircuitDoc|LogicDoc|builder/i],
  ['drag', /MovableDot|useDraggable|onDrag\b/],
];

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (entry === 'types') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (['.ts', '.tsx'].includes(extname(path))) files.push(path);
  }
};
walk(ROOT);

/**
 * A lab is judged on its whole folder, not one file.
 *
 * A manifest lab keeps its runtime in runtime.tsx and its questions next door in activity.ts, so
 * reading only the file that exports the component reports it as asking nothing. Counting the
 * siblings is the difference between "47% of labs never ask" and the truth.
 */
const sourceOf = new Map();
const read = (path) => {
  if (!sourceOf.has(path)) sourceOf.set(path, readFileSync(path, 'utf8'));
  return sourceOf.get(path);
};
const labs = files
  .filter((file) => /export\s+function\s+\w*Lab\b/.test(read(file)))
  .map((file) => {
    const rel = file.slice(ROOT.length).replace(/\\/g, '/');
    const folder = file.slice(0, file.lastIndexOf('\\') > 0 ? file.lastIndexOf('\\') : file.lastIndexOf('/'));
    const siblings = files.filter((other) => other.startsWith(folder));
    const source = siblings.map(read).join('\n');
    return {
      domain: rel.split('/')[0],
      name: rel,
      verbs: VERBS.filter(([, re]) => re.test(source)).map(([verb]) => verb),
    };
  })
  .filter((lab) => (only ? lab.domain === only : true));

const tally = new Map();
for (const lab of labs)
  for (const verb of lab.verbs.length ? lab.verbs : ['none']) tally.set(verb, (tally.get(verb) ?? 0) + 1);

console.log(`${labs.length} labs\n`);
for (const [verb, n] of [...tally].sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(n).padStart(4)}  ${String(Math.round((n / labs.length) * 100)).padStart(3)}%  ${verb}`);

/** A domain that only ever asks one way is the thing this exists to surface. */
const byDomain = new Map();
for (const lab of labs) {
  if (!byDomain.has(lab.domain)) byDomain.set(lab.domain, { labs: 0, verbs: new Set() });
  const entry = byDomain.get(lab.domain);
  entry.labs += 1;
  for (const verb of lab.verbs) entry.verbs.add(verb);
}
console.log(`\nways of asking, per domain:`);
const monotone = [];
for (const [domain, entry] of [...byDomain].sort((a, b) => b[1].labs - a[1].labs)) {
  const list = [...entry.verbs].sort().join(', ') || 'none';
  console.log(`  ${String(entry.labs).padStart(3)} labs  ${domain.padEnd(12)} ${list}`);
  if (entry.labs >= 8 && entry.verbs.size <= 1) monotone.push(domain);
}

const silent = labs.filter((lab) => !lab.verbs.length);
if (silent.length) console.log(`\n${silent.length} labs ask nothing at all (the learner never commits)`);

if (monotone.length) {
  console.log(`\n✗ one way of asking across a whole subject: ${monotone.join(', ')}`);
  if (strict) process.exit(1);
}
