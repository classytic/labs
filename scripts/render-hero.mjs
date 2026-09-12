/**
 * render-hero — turn a live lab figure into a still illustration.
 *
 * Where HTML/CSS cannot draw a subject well enough for a hero (a lit 3D cell, a rendered
 * apparatus), the host ships an IMAGE and the lab shows it through `<Illustration>`. This
 * script produces that image from what we already have: it drives the running mentora dev
 * server (apps/web on :4001, the same harness as tests/gallery/live.mjs) with SwiftShader so
 * WebGL scenes render, and screenshots ONE figure at 2× device pixels, light and dark.
 *
 *   node scripts/render-hero.mjs <route> --match=<lab heading text> --out=<dir> [--name=<file>]
 *                                [--scale=2] [--target=figure|scene|lab] [--wait=2500]
 *
 *   node scripts/render-hero.mjs biology --match="mitosis" \
 *        --out=d:/projects/brihot/apps/web/public/labs/illustrations/biology --name=mitosis
 *   → mitosis.png + mitosis.dark.png (and .webp twins when `sharp` is resolvable)
 *
 * `--target` picks what to crop: `figure` (the first .lab-figure / .lab-three-scene inside the
 * lab, default), `scene` (the activity canvas), or `lab` (the whole activity).
 * For Blender-authored art see scripts/blender/render-hero.py and docs/ILLUSTRATIONS.md.
 */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const route = process.argv.slice(2).find((a) => !a.startsWith('--'));
const match = arg('match', '')?.toLowerCase();
const out = resolve(arg('out', 'tests/gallery/hero'));
const name = arg('name', `${route}-${(match || 'hero').replace(/[^a-z0-9]+/g, '-')}`);
const scale = Number(arg('scale', '2'));
const target = arg('target', 'figure');
const wait = Number(arg('wait', '2500'));
const base = process.env.LABS_LIVE_BASE ?? 'http://localhost:4001/stage-preview/';
if (!route || !match) {
  console.error('usage: node scripts/render-hero.mjs <route> --match=<text> [--out=<dir>] [--name=<file>]');
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const SELECTOR = {
  figure: '.lab-figure, .lab-three-scene, .lab-activity-canvas svg, .lab-activity-canvas canvas',
  scene: '.lab-activity-canvas',
  lab: '.lab-activity',
}[target];
if (!SELECTOR) throw new Error(`unknown --target ${target}`);

let sharp = null;
try {
  sharp = createRequire(import.meta.url)('sharp');
} catch {
  /* optional: PNG only */
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
try {
  for (const scheme of ['light', 'dark']) {
    const page = await (
      await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: scale,
        colorScheme: scheme,
      })
    ).newPage();
    await page.goto(base + route, { waitUntil: 'networkidle', timeout: 180_000 });
    await page.waitForTimeout(wait);
    const labs = await page.$$('.lab-activity');
    let lab = null;
    for (const candidate of labs) {
      if ((await candidate.innerText()).toLowerCase().includes(match)) {
        lab = candidate;
        break;
      }
    }
    if (!lab) throw new Error(`no lab on /${route} matches "${match}"`);
    await lab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(wait); // deferred WebGL mount + first frames
    const el = target === 'lab' ? lab : await lab.$(SELECTOR);
    if (!el) throw new Error(`no ${target} element (${SELECTOR}) inside the matched lab`);
    const file = join(out, `${name}${scheme === 'dark' ? '.dark' : ''}.png`);
    await el.screenshot({ path: file, omitBackground: false });
    console.log(`[hero] ${file}`);
    if (sharp) {
      const webp = file.replace(/\.png$/, '.webp');
      await sharp(file).webp({ quality: 88 }).toFile(webp);
      console.log(`[hero] ${webp}`);
    }
    await page.context().close();
  }
} finally {
  await browser.close();
}
