/**
 * Audit: "say it once". For every lab on the authored shell, list the dynamic expressions
 * (`state.gamma.toFixed(2)`, `s.beta`, …) that appear in MORE than one shell slot — status
 * strip, Readout headline/sub, StatList/metric rows, OBSERVE callout. A fact should have one
 * home (see .claude/skills/lab-design/SKILL.md §3).
 *
 *   node scripts/say-it-once.mjs            # report
 *   node scripts/say-it-once.mjs --strict   # exit 1 when any lab repeats a fact
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)), 'src');
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx$/.test(name)) files.push(p);
  }
})(root);

/** Extract the balanced `{…}` (or `"…"`) value after `prop=` in JSX text. */
function propValue(source, prop) {
  const at = source.indexOf(` ${prop}=`);
  if (at < 0) return null;
  const i = at + prop.length + 2;
  if (source[i] === '"') return source.slice(i + 1, source.indexOf('"', i + 1));
  if (source[i] !== '{') return null;
  let depth = 0;
  for (let j = i; j < source.length; j++) {
    if (source[j] === '{') depth++;
    else if (source[j] === '}' && --depth === 0) return source.slice(i + 1, j);
  }
  return null;
}

/** Dynamic "facts": member chains on the usual state objects, formatted numbers, fmt() calls. */
const FACT =
  /\b(?:state|s|st|result|model|value|current|derived|summary|attachment)\.[A-Za-z_.]+(?:\([^)]*\))?|\bfmt\([^()]*\)|\b[A-Za-z_][\w.]*\.toFixed\(\d\)/g;

/** Every shell's "say it once" slots: the status strip, the headline/readout, the rows, the interpretation. */
const SLOT_PROPS = {
  status: 'status',
  readout: 'readout',
  measurements: 'rows',
  instruments: 'rows',
  evidence: 'rows',
  conclusion: 'observe',
  feedback: 'observe',
  observation: 'observe',
};

const offenders = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (!/<(?:[A-Z]\w*Activity(?:Runtime)?)\b/.test(src) || /^\s*export function \w+Activity\b/m.test(src))
    continue;
  const slots = {};
  for (const [prop, slot] of Object.entries(SLOT_PROPS)) {
    const text = propValue(src, prop);
    if (!text) continue;
    if (prop === 'evidence' || prop === 'measurements' || prop === 'instruments') {
      const readout = text.match(/<Readout[\s\S]*?\/>/);
      if (readout) slots.readout = (slots.readout ?? '') + readout[0];
      const rows = text.replace(readout?.[0] ?? '', '');
      if (rows.trim()) slots[slot] = (slots[slot] ?? '') + rows;
    } else slots[slot] = (slots[slot] ?? '') + text;
  }
  const facts = new Map();
  for (const [slot, text] of Object.entries(slots)) {
    for (const m of new Set(text.match(FACT) ?? [])) {
      if (!facts.has(m)) facts.set(m, new Set());
      facts.get(m).add(slot);
    }
  }
  const repeated = [...facts].filter(([, s]) => s.size > 1).map(([f, s]) => `${f} → ${[...s].join(' + ')}`);
  if (repeated.length) offenders.push({ file: relative(root, file).split('\\').join('/'), repeated, slots });
}

const verbose = process.argv.includes('--verbose');
const squash = (text) => text.replace(/\s+/g, ' ').trim().slice(0, 360);
for (const o of offenders) {
  console.log(`✗ ${o.file}`);
  for (const r of o.repeated) console.log(`    ${r}`);
  if (verbose)
    for (const [slot, text] of Object.entries(o.slots)) console.log(`      [${slot}] ${squash(text)}`);
}
console.log(`\n${offenders.length} authored labs repeat a fact across shell slots`);
if (process.argv.includes('--strict') && offenders.length) process.exit(1);
