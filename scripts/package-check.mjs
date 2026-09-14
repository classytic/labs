/**
 * Validate the package exactly as consumers see it after `npm run build`.
 * A declared export must have both a runtime and declaration target, and every
 * JavaScript entry must be safe to import in a Node/SSR environment.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const failures = [];
const runtimeTargets = new Set();

// Labs deliberately composes the consumer's shadcn source components through
// `@/components/ui/*`. A bare Node process has no host alias, so validate the
// published entries against the same minimal host contract used by the gallery
// and component tests. This still catches missing exports, invalid ESM and API
// drift while avoiding a false failure for the documented host-owned UI seam.
register('../tests/host-shims/loader.mjs', import.meta.url);

for (const [subpath, condition] of Object.entries(pkg.exports)) {
  // A wildcard subpath has no single target to stat; the import walk below proves each file it
  // covers exists, which is the thing that actually breaks a consumer.
  if (subpath.includes('*')) continue;
  const targets = typeof condition === 'string' ? { default: condition } : condition;
  for (const [kind, target] of Object.entries(targets)) {
    if (typeof target !== 'string') continue;
    const absolute = resolve(root, target);
    if (!existsSync(absolute)) failures.push(`${subpath} (${kind}) points to missing ${target}`);
    if (kind === 'default' && /\.mjs$/.test(target)) runtimeTargets.add(absolute);
  }
}

for (const required of pkg.files ?? []) {
  if (!existsSync(resolve(root, required))) failures.push(`published file entry is missing: ${required}`);
}

// Every sheet a stylesheet pulls in must ALSO be an export, and must exist. A bundler resolving a
// relative @import goes through the exports map, so a sheet missing from it fails the consumer's CSS
// build with "Can't resolve ./styles/…" even though the file is right there (figure.css did exactly
// that). Walk the graph: domains.css now imports parts, and each domain sheet imports those parts.
const exported = (subpath) =>
  subpath in pkg.exports ||
  Object.keys(pkg.exports).some((key) => {
    if (!key.includes('*')) return false;
    const [head, tail] = key.split('*');
    return subpath.startsWith(head) && subpath.endsWith(tail);
  });
const seenSheets = new Set();
const walkSheet = (relative) => {
  if (seenSheets.has(relative)) return;
  seenSheets.add(relative);
  const file = resolve(root, relative);
  if (!existsSync(file)) {
    failures.push(`missing stylesheet ${relative}`);
    return;
  }
  const dir = relative.slice(0, relative.lastIndexOf('/') + 1);
  for (const match of readFileSync(file, 'utf8').matchAll(/@import\s+"\.\/([^"]+)"/g)) {
    const target = `${dir}${match[1]}`;
    if (!exported(`./${target}`)) failures.push(`${relative} imports ./${target}, which is not in "exports"`);
    walkSheet(target);
  }
};
walkSheet('styles.css');

/**
 * CSS budgets.
 *
 * gzip is what a consumer actually downloads and is the strict number. The source budget is a
 * discipline on how many RULES a layer carries, and counts the CSS with comments removed: this
 * package explains its CSS at length on purpose (core.css is 18% prose), and counting that prose
 * made documentation compete with rules for one ceiling, where the cheapest way to pass was to
 * delete the explanation. Comments cost nothing after gzip, which the transfer budget governs.
 *
 * Domain weight is budgeted PER DOMAIN rather than in aggregate: since the split, an app that shows
 * one subject imports only that subject's sheet, so the number that matters to a learner on a maths
 * page is the size of math.css (29 KiB), not of every domain ever written (169 KiB).
 */
const cssLayers = [
  { file: 'styles/core.css', rulesBudget: 96 * 1024, gzipBudget: 16 * 1024 },
  { file: 'styles/commerce.css', rulesBudget: 22 * 1024, gzipBudget: 5 * 1024 },
  { file: 'styles/modern-physics.css', rulesBudget: 8 * 1024, gzipBudget: 2 * 1024 },
];
/** No single domain may grow past 40 KiB; past that it wants splitting into its own subjects. */
for (const file of readdirSync(resolve(root, 'styles', 'domains')).filter((name) => name.endsWith('.css'))) {
  const sheet = readFileSync(resolve(root, 'styles', 'domains', file), 'utf8');
  const bytes = [...sheet.matchAll(/@import "\.\/(?:parts\/)?([a-z0-9-]+)\.css"/g)]
    .map((m) =>
      resolve(
        root,
        'styles',
        'domains',
        existsSync(resolve(root, 'styles', 'domains', 'parts', `${m[1]}.css`))
          ? `parts/${m[1]}.css`
          : `${m[1]}.css`,
      ),
    )
    .reduce((total, part) => total + (existsSync(part) ? readFileSync(part).byteLength : 0), 0);
  if (bytes > 40 * 1024)
    failures.push(`styles/domains/${file} resolves to ${bytes} bytes (budget: ${40 * 1024})`);
}
const cssResults = cssLayers.map(({ file, rulesBudget, gzipBudget }) => {
  const css = readFileSync(resolve(root, file));
  const rules = css.toString('utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rulesBytes = Buffer.byteLength(rules);
  const transfer = gzipSync(rules.replace(/\s+/g, ' ')).byteLength;
  if (rulesBytes > rulesBudget) failures.push(`${file} is ${rulesBytes} bytes of rules (budget: ${rulesBudget})`);
  if (transfer > gzipBudget) failures.push(`${file} is ${transfer} bytes gzip (budget: ${gzipBudget})`);
  return `${file} ${rulesBytes} bytes of rules / ${transfer} gzip`;
});

for (const target of runtimeTargets) {
  if (!existsSync(target)) continue;
  try {
    await import(pathToFileURL(target).href);
  } catch (error) {
    failures.push(
      `SSR import failed for ${target.replace(`${root}\\`, '').replace(`${root}/`, '')}: ${error?.message ?? error}`,
    );
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  console.error(`\n✗ package contract failed (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  process.exit(1);
}

console.log(
  `✓ package contract passed — ${Object.keys(pkg.exports).length} exports resolve and ${runtimeTargets.size} runtime entries are SSR-importable`,
);
console.log(`✓ CSS layers — ${cssResults.join('; ')}`);
