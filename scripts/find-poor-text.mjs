/**
 * Text a learner reads, scanned for the faults found by eye in the gas box.
 *
 * One header carried three at once: a phase chip repeating its own step title, a readout labelled
 * `P 60` sitting beside `V 7.0 L` so it looked like a unit had been forgotten, and a task lead
 * restating the question directly beneath it, in shouty capitals. None of that is visible to a
 * type checker or a schema, and none of it is a rendering bug. It is simply badly written, and it
 * is the layer a student spends the most time reading.
 *
 * Three checks. The first two are defects; the third is a smell for a human to judge:
 *
 *   echo         a step's `lead` and the question `prompt` under it say the same thing twice.
 *   shout        a word in ALL CAPS used for emphasis, which prose does not need.
 *   mixed-units  a status row where some readouts carry a unit and others do not. Sometimes right
 *                (a molecule count has no unit) and sometimes the gas box, where a bare `P 60` sat
 *                beside `V 7.0 L` and read as an omission. Reported, never assumed.
 *
 * A fourth check was written and then deleted: a step title repeating its own phase word. It
 * reported 160 titles, all of them fine. The fault was the status row printing the phase chip
 * beside them, which is fixed in the runtime, so the check measured a solved problem.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.tsx') || path.endsWith('.ts')) files.push(path.replace(/\\/g, '/'));
  }
})('src');

/** Words that are legitimately capitalised: units, symbols, acronyms, chemistry. */
const ALLOWED_CAPS = new Set([
  'A',
  'V',
  'W',
  'J',
  'N',
  'K',
  'C',
  'F',
  'L',
  'M',
  'S',
  'T',
  'P',
  'Q',
  'R',
  'G',
  'B',
  'H',
  'I',
  'E',
  'X',
  'Y',
  'Z',
  'AC',
  'DC',
  'PV',
  'RC',
  'LED',
  'SI',
  'DNA',
  'RNA',
  'ATP',
  'PH',
  'CPU',
  'RAM',
  'IP',
  'TCP',
  'UDP',
  'HTTP',
  'URL',
  'NAND',
  'NOR',
  'XOR',
  'AND',
  'OR',
  'NOT',
  'CMOS',
  'PMOS',
  'NMOS',
  'GND',
  'VDD',
  'MRI',
  'CT',
  'UV',
  'IR',
  'HCF',
  'LCM',
  'CAST',
  'KE',
  'PE',
  'EMF',
  'RMS',
  'STP',
  'RTP',
  'OK',
  'ID',
  'TV',
  'US',
  'UK',
  'IUPAC',
]);

const normalise = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Do two sentences carry the same content, allowing for rewording at the edges? */
function echoes(a, b) {
  const wa = new Set(
    normalise(a)
      .split(' ')
      .filter((w) => w.length > 3),
  );
  const wb = new Set(
    normalise(b)
      .split(' ')
      .filter((w) => w.length > 3),
  );
  if (wa.size < 3 || wb.size < 3) return false;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.min(wa.size, wb.size) >= 0.7;
}

const findings = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');

  // A lead followed by a question prompt that restates it.
  const leads = [...src.matchAll(/lead:\s*'([^']{20,})'/g)].map((m) => m[1]);
  const prompts = [...src.matchAll(/prompt:\s*'([^']{20,})'/g)].map((m) => m[1]);
  for (const lead of leads)
    for (const prompt of prompts)
      if (echoes(lead, prompt))
        findings.push({ kind: 'echo', file, detail: `"${lead.slice(0, 48)}…" ≈ "${prompt.slice(0, 48)}…"` });

  for (const m of src.matchAll(/(?:prompt|lead|explain|title|label|note|text):\s*'([^']{12,})'/g)) {
    // Three letters or more, and not the leading half of a formula: `CO₂` is not shouting, and
    // matching two-letter runs turned every mention of the rough ER into a finding.
    for (const word of m[1].matchAll(/\b([A-Z]{3,})(?![₀-₉²³¹])\b/g)) {
      if (ALLOWED_CAPS.has(word[1])) continue;
      if (/^[IVXLC]+$/.test(word[1])) continue; // roman numerals
      findings.push({ kind: 'shout', file, detail: `"${word[1]}" in "${m[1].slice(0, 52)}…"` });
    }
  }

  // A status row where some readouts carry a unit and others do not. Symbols are fine (A, B, Y on
  // a gate are the real notation); what misleads is `P 60` sitting beside `V 7.0 L`, because the
  // neighbour's unit makes the bare one look like an omission rather than a dimensionless value.
  const row = src.match(/status=\{\s*<>([\s\S]*?)<\/>\s*\}/);
  if (row) {
    const spans = [...row[1].matchAll(/<span>([\s\S]*?)<\/span>/g)].map((m) => m[1]);
    const numeric = spans.filter((t) => /\{/.test(t));
    const united = numeric.filter((t) => /\}\s*[A-Za-z%°]/.test(t));
    if (numeric.length >= 3 && united.length && united.length < numeric.length)
      findings.push({
        kind: 'mixed-units',
        file,
        detail: `${united.length} of ${numeric.length} readouts carry a unit, so the rest look unfinished`,
      });
  }
}

const byKind = new Map();
for (const f of findings) byKind.set(f.kind, [...(byKind.get(f.kind) ?? []), f]);
for (const [kind, list] of [...byKind].sort((a, b) => b[1].length - a[1].length)) {
  const files = new Set(list.map((f) => f.file)).size;
  console.log(`\n${kind}: ${list.length} in ${files} file(s)`);
  for (const f of list.slice(0, 6)) console.log(`  ${f.file.replace('src/', '')}: ${f.detail}`);
  if (list.length > 6) console.log(`  … and ${list.length - 6} more`);
}
console.log(`\n${findings.length} finding(s) across ${new Set(findings.map((f) => f.file)).size} file(s).`);
