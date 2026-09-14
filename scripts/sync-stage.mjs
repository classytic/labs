/**
 * Dev-only, opt-in: mirror the sibling `../stage` build into node_modules.
 *
 * Run it (`npm run sync:stage`) only while developing a stage change alongside labs, to
 * test against the sibling checkout before that change is published. It is a no-op when
 * there is no sibling checkout (CI, consumers) or when the sibling has not been built.
 *
 * It used to run as `postinstall`, back when the source imported subpaths (`stage/finance`,
 * `stage/logic`) that existed only in the unpublished sibling. Those ship in stage 0.3.0,
 * so the automatic copy had become a liability: it silently replaced the npm package on
 * every install, which meant labs could never actually be tested against what consumers
 * resolve. `npm install` now leaves the published package in place.
 */
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const labs = join(dirname(fileURLToPath(import.meta.url)), '..');
const sibling = join(labs, '..', 'stage');
const target = join(labs, 'node_modules', '@classytic', 'stage');

if (!existsSync(join(sibling, 'dist', 'index.mjs')) || !existsSync(target)) {
  process.exit(0);
}

const version = (dir) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
const from = version(sibling);
const installed = version(target);

/**
 * The stylesheet ships alongside the build and is a real part of the package: a consumer resolves
 * `@classytic/stage/styles.css` from node_modules, not from the sibling checkout. It was not being
 * mirrored, and the version check short-circuits during development because a local edit does not
 * bump the version, so a CSS-only fix could sit in the source for as long as you liked and never
 * reach the app. Comparing the file directly is the only way to notice.
 */
const styles = (dir) => {
  const path = join(dir, 'styles.css');
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
};
const cssDiffers = styles(sibling) !== null && styles(sibling) !== styles(target);

if (installed === from && !cssDiffers && existsSync(join(target, 'dist', 'finance', 'index.mjs'))) {
  process.exit(0);
}

rmSync(join(target, 'dist'), { recursive: true, force: true });
cpSync(join(sibling, 'dist'), join(target, 'dist'), { recursive: true });
cpSync(join(sibling, 'package.json'), join(target, 'package.json'));
if (styles(sibling) !== null) cpSync(join(sibling, 'styles.css'), join(target, 'styles.css'));
const why = installed === from ? 'styles.css changed' : `${installed} → ${from}`;
console.log(`[sync-stage] @classytic/stage ${why} (mirrored from ../stage)`);
