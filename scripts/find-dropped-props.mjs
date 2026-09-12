/**
 * Schema props a runtime adapter never reads.
 *
 * A lab's manifest declares what an author may write; the domain runtime decides what actually
 * reaches the component. When the two disagree, nothing complains: zod accepts the prop, the
 * props checker validates it, the editor offers a field for it, and the adapter drops it on the
 * floor. The lesson author sees no error and the learner sees no effect.
 *
 * That is not hypothetical. `math/derivation` forwarded `steps` and `title` only, so the graded
 * `answer` that withholds a derivation's final line never reached the component. Forty-seven
 * rebuilt lessons depended on it and none of them worked, and every layer was individually right.
 *
 * The scan is deliberately conservative. An adapter that spreads its props is skipped, because it
 * cannot drop anything, and props the block layer consumes before the runtime sees them are
 * ignored by name. What is left is a real mismatch worth a human look.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { labManifests } = await import(pathToFileURL(join('dist', 'domains', 'manifests.mjs')).href);

/** Handled by the block/activity layer above the runtime, so an adapter need not read them. */
const HANDLED_ABOVE = new Set([
  'activity',
  'activityId',
  'controlId',
  'objectives',
  'prompt',
  'className',
  'height',
]);

const rows = [];
for (const manifest of labManifests) {
  const shape = manifest.schema?.shape;
  if (!shape) continue;
  const dir = join('src', 'domains', manifest.domain, manifest.id);
  const file = join(dir, 'runtime.tsx');
  if (!existsSync(file)) continue;
  const src = readFileSync(file, 'utf8');

  // A re-export (`export { X as default }`) hands every prop straight through.
  if (/export\s*\{[^}]*as default[^}]*\}/.test(src)) continue;
  // A spread cannot drop anything.
  // Any spread of an identifier forwards everything, including a parenthesised cast such as
  // `{...(p as Props)}`, which an earlier pattern missed and reported as dropping seven props.
  if (/\.\.\.\s*\(?\s*[A-Za-z_$][\w$]*/.test(src)) continue;

  // Every `a.foo` the adapter reads, anything it destructures, and every quoted string in the
  // file. The last one is deliberately over-generous: several adapters read props by dynamic key
  // (`num('answerA', 5)`), which no property-access pattern can see. Over-counting reads means
  // under-reporting drops, which is the right way round for a scan a human has to triage.
  const read = new Set();
  for (const m of src.matchAll(/\b[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)/g)) read.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|function\s*\w*\s*\()\s*\{([^}]*)\}/g))
    for (const name of m[1].split(',')) read.add(name.trim().split(/[:=]/)[0].trim());
  for (const m of src.matchAll(/['"`]([A-Za-z_$][\w$]*)['"`]/g)) read.add(m[1]);

  const dropped = Object.keys(shape).filter((key) => !read.has(key) && !HANDLED_ABOVE.has(key));
  if (dropped.length) rows.push({ id: manifest.id, domain: manifest.domain, dropped });
}

rows.sort((a, b) => b.dropped.length - a.dropped.length);
for (const row of rows) console.log(`${row.domain}/${row.id}: ${row.dropped.join(', ')}`);
console.log(`\n${rows.length} adapter(s) never read at least one prop their schema accepts.`);
