/** Every distinct ALL-CAPS word in authored lab strings, with a count, for a human to triage. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.ts') || path.endsWith('.tsx')) files.push(path);
  }
})('src');

const allowed = new Set([
  'AND',
  'NOT',
  'NAND',
  'NOR',
  'XOR',
  'CMOS',
  'PMOS',
  'NMOS',
  'GND',
  'VDD',
  'DNA',
  'RNA',
  'ATP',
  'LED',
  'MRI',
  'IUPAC',
  'HCF',
  'LCM',
  'CAST',
  'EMF',
  'RMS',
  'STP',
  'RTP',
  'HTTP',
  'URL',
  'TCP',
  'UDP',
  'CPU',
  'RAM',
  'SHM',
  'AC',
  'DC',
]);

const seen = new Map();
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  // Both `prompt: '...'` (an object property) and `prompt = '...'` (a default parameter), in
  // either quote style. The first version matched only single-quoted properties and so missed
  // every default-parameter prompt, which is where a lab's main description usually lives.
  for (const m of src.matchAll(
    /(?:prompt|lead|explain|title|label|note|text)\s*[:=]\s*(['"])((?:(?!\1)[\s\S]){12,}?)\1/g,
  ))
    for (const w of m[2].matchAll(/\b([A-Z]{3,})(?![₀-₉²³¹])\b/g)) {
      if (allowed.has(w[1])) continue;
      seen.set(w[1], (seen.get(w[1]) ?? 0) + 1);
    }
}
const rows = [...seen].sort((a, b) => b[1] - a[1]);
console.log(`${rows.length} distinct all-caps words, ${rows.reduce((n, r) => n + r[1], 0)} uses`);
for (const [word, n] of rows) console.log(`  ${String(n).padStart(3)}  ${word}`);
