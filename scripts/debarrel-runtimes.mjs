/**
 * Repoint per-lab runtime/shared imports from a DOMAIN BARREL (`../../../<barrel>/index.js`) to the
 * exact LEAF module the component/type lives in, so Turbopack/webpack never has to traverse the whole
 * domain barrel to reach one lab. Mechanical + idempotent: it reads each `src/<barrel>/index.ts`
 * re-export map (exported name → leaf path), then rewrites matching imports under `src/domains/`.
 *
 *   node scripts/debarrel-runtimes.mjs          # apply
 *   node scripts/debarrel-runtimes.mjs --check   # fail if any barrel import remains (CI drift guard)
 *
 * A single import that spans multiple leaves is split into one line per leaf. Names a barrel doesn't
 * re-export (shouldn't happen) are left on the barrel and reported.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const check = process.argv.includes('--check');
const SRC = new URL('../src/', import.meta.url);
const barrelRe = /from '\.\.\/\.\.\/\.\.\/([a-z-]+)\/index\.js'/;

/** exported-name → leaf module (relative to the barrel dir, e.g. './wave-lab/index.js'). */
function barrelMap(barrel) {
  const idx = new URL(`${barrel}/index.ts`, SRC);
  if (!existsSync(idx)) return null;
  const text = readFileSync(idx, 'utf8');
  const map = {};
  // export { A, type B, C as D } from './x/index.js';
  const re = /export\s*(?:type\s+)?\{([^}]*)\}\s*from\s*'(\.\/[^']+)'/g;
  let m;
  while ((m = re.exec(text))) {
    const from = m[2];
    for (let name of m[1].split(',')) {
      name = name.trim().replace(/^type\s+/, '');
      if (!name) continue;
      const asMatch = name.match(/^(\S+)\s+as\s+(\S+)$/);
      const exported = asMatch ? asMatch[2] : name;
      map[exported] = from;
    }
  }
  return map;
}

const maps = {};
function mapFor(barrel) {
  if (!(barrel in maps)) maps[barrel] = barrelMap(barrel);
  return maps[barrel];
}

/** Walk src/domains for runtime.tsx / shared.ts style files. */
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = new URL(`${dir.pathname}${e.name}${e.isDirectory() ? '/' : ''}`, dir);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|mts)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(new URL('domains/', SRC));
let changed = 0;
const unresolved = [];

for (const file of files) {
  let text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  let dirty = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bm = line.match(barrelRe);
    if (!bm) continue;
    const barrel = bm[1];
    const map = mapFor(barrel);
    if (!map) continue;

    // Parse the names in this import/export line: `import { A, type B } from ...` or `export { A as default } from ...`
    const namesMatch = line.match(/\{([^}]*)\}/);
    if (!namesMatch) continue;
    // Preserve a STATEMENT-level `import type {` / `export type {` modifier (dropping it would turn a
    // type-only import into a value import → build break).
    const kw = /^\s*export\s+type\s*\{/.test(line)
      ? 'export type'
      : /^\s*export\s*\{/.test(line)
        ? 'export'
        : /^\s*import\s+type\s*\{/.test(line)
          ? 'import type'
          : 'import';
    const specs = namesMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Resolve each spec to its leaf; the "lookup name" is the local/imported name (before `as`).
    const byLeaf = new Map();
    let allResolved = true;
    for (const spec of specs) {
      const bare = spec.replace(/^type\s+/, '');
      const lookup = bare.split(/\s+as\s+/)[0].trim();
      const leaf = map[lookup];
      if (!leaf) {
        allResolved = false;
        unresolved.push(`${file.pathname}: ${lookup} not in ${barrel}`);
        break;
      }
      if (!byLeaf.has(leaf)) byLeaf.set(leaf, []);
      byLeaf.get(leaf).push(spec);
    }
    if (!allResolved) continue;

    const newLines = [...byLeaf.entries()].map(([leaf, ss]) => {
      const path = `../../../${barrel}/${leaf.slice(2)}`;
      return `${kw} { ${ss.join(', ')} } from '${path}';`;
    });
    lines[i] = newLines.join('\n');
    dirty = true;
  }

  if (dirty) {
    const next = lines.join('\n');
    if (next !== text) {
      if (!check) writeFileSync(file, next);
      changed++;
    }
  }
}

if (check) {
  if (changed > 0) {
    console.error(
      `✗ ${changed} file(s) still import from a domain barrel — run: node scripts/debarrel-runtimes.mjs`,
    );
    process.exit(1);
  }
  console.log('✓ no domain-barrel runtime imports');
} else {
  console.log(`repointed ${changed} file(s) to leaf modules`);
  if (unresolved.length) {
    console.log('unresolved (left on barrel):');
    for (const u of unresolved) console.log('  ' + u);
  }
}
