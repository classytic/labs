/**
 * How many labs that ADVERTISE `hints` actually show them?
 *
 * `hints` reaches most schemas through `commonLabProps`, so the field is offered almost
 * everywhere. Whether a learner ever sees a hint depends on the component wiring `useHints` and
 * rendering a `HintLadder`. If most components do, the handful that do not are bugs to fix. If
 * most do not, then `hints` does not belong in the common props at all, and the honest fix is at
 * the source rather than in thirteen adapters.
 *
 * Measure before choosing, because the two fixes point in opposite directions.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { labManifests } = await import(pathToFileURL(join('dist', 'domains', 'manifests.mjs')).href);

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.tsx')) files.push(path);
  }
})('src');

// A component honours hints when it turns them into a ladder the learner can open.
const implementers = new Set();
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (/useHints\s*\(/.test(src) || /<HintLadder/.test(src)) implementers.add(file.replace(/\\/g, '/'));
}

const advertised = labManifests.filter((m) => m.schema?.shape?.hints);
console.log(`labs whose SCHEMA offers hints: ${advertised.length} of ${labManifests.length}`);
console.log(`source files that actually render a hint ladder: ${implementers.size}`);
for (const file of [...implementers].sort()) console.log(`  ${file}`);
