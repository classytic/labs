// Dev sync: copy the freshly built dist + styles.css + package.json into a
// consumer's node_modules/@classytic/sci-viz (the fluid `postbuild` pattern).
//
// Usage:
//   node scripts/sync-sci-viz.mjs <consumer-app-dir> [<consumer-app-dir> ...]
//   SCIVIZ_CONSUMERS="d:/projects/brihot/apps/web" node scripts/sync-sci-viz.mjs
//
// Lets us iterate without publishing to npm.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(pkgRoot, 'dist');

if (!fs.existsSync(dist) || fs.readdirSync(dist).length === 0) {
  console.error('[sync-sci-viz] dist/ missing or empty — run `npm run build` first.');
  process.exit(1);
}

const args = process.argv.slice(2);
const fromEnv = (process.env.SCIVIZ_CONSUMERS ?? '')
  .split(/[,;]/)
  .map((s) => s.trim())
  .filter(Boolean);
const consumers = [...args, ...fromEnv];

if (consumers.length === 0) {
  console.error('[sync-sci-viz] no consumer dirs given (args or SCIVIZ_CONSUMERS).');
  process.exit(1);
}

for (const appDir of consumers) {
  const target = path.join(path.resolve(appDir), 'node_modules', '@classytic', 'labs');
  fs.mkdirSync(target, { recursive: true });
  fs.rmSync(path.join(target, 'dist'), { recursive: true, force: true });
  fs.cpSync(dist, path.join(target, 'dist'), { recursive: true });
  // Keep the published CSS graph continuously resolvable while a host dev
  // server is running. Removing this directory first creates a brief window in
  // which styles.css exists but its relative imports do not; Turbopack can
  // observe and cache that transient failure. cpSync overwrites changed sheets
  // in place, so there is no reason to tear down the directory.
  fs.cpSync(path.join(pkgRoot, 'styles'), path.join(target, 'styles'), { recursive: true });
  fs.copyFileSync(path.join(pkgRoot, 'styles.css'), path.join(target, 'styles.css'));
  fs.copyFileSync(path.join(pkgRoot, 'package.json'), path.join(target, 'package.json'));

  for (const requiredFile of [
    'styles.css',
    'styles/core.css',
    'styles/figure.css',
    'styles/domains.css',
    'styles/commerce.css',
    'styles/exam.css',
    'styles/three.css',
    'styles/modern-physics.css',
  ]) {
    if (!fs.existsSync(path.join(target, requiredFile))) {
      throw new Error(`[sync-sci-viz] incomplete package: missing ${requiredFile}`);
    }
  }
  console.log(`[sync-sci-viz] synced → ${target}`);
}
