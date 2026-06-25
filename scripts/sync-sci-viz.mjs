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
const fromEnv = (process.env.SCIVIZ_CONSUMERS ?? '').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
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
  fs.copyFileSync(path.join(pkgRoot, 'styles.css'), path.join(target, 'styles.css'));
  fs.copyFileSync(path.join(pkgRoot, 'package.json'), path.join(target, 'package.json'));
  console.log(`[sync-sci-viz] synced → ${target}`);
}
