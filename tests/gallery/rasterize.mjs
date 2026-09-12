/**
 * Gallery · PNG renderer — the pixel-faithful half of the visual harness.
 *
 * Renders each registered scene (tests/gallery/registry.mjs) to static SVG
 * markup, wraps it in a self-contained HTML doc with the REAL stage + labs
 * stylesheets inlined, and screenshots it in a headless browser to
 * tests/gallery/png/<name>.<light|dark>.png — both themes, because a glyph must
 * read on the light AND the dark card. This is what lets a human (or an agent)
 * actually SEE and judge the representation, including color-mix / oklch /
 * gradients that an SVG-string snapshot can't convey.
 *
 * No browser download: launches the system Chrome via `channel:'chrome'`.
 * Static markup only (no hydration) — `<Stage>` is SSR-safe and falls back to a
 * 640px canvas, so glyphs render at rest without client JS. Run: `npm run gallery`.
 */

import { mkdirSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';

// The kit imports the HOST's shadcn components (`@/components/ui/*`, resolved by the Next
// host's transpilePackages). Map them onto the harness shims BEFORE the registry loads.
register('../host-shims/loader.mjs', import.meta.url);
const { GALLERY } = await import('./registry.mjs');

const { docHtml } = await import('./page-shell.mjs');
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'png');
mkdirSync(outDir, { recursive: true });

let pw;
try {
  pw = await import('playwright');
} catch {
  console.error('[gallery] playwright not installed — run:  npm i -D playwright');
  process.exit(0);
}

const browser = await pw.chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 760, height: 760 }, deviceScaleFactor: 2 });

const only = process.argv.slice(2);
const scenes = only.length ? GALLERY.filter((g) => only.some((o) => g.name.includes(o))) : GALLERY;
for (const { name, element } of scenes) {
  let markup;
  try {
    markup = renderToStaticMarkup(element);
  } catch (e) {
    console.error(`[gallery] ${name} — render failed: ${e.message}`);
    continue;
  }
  for (const dark of [false, true]) {
    await page.setContent(docHtml(markup, dark), { waitUntil: 'load' });
    const card = await page.$('.card');
    const file = join(outDir, `${name}.${dark ? 'dark' : 'light'}.png`);
    await card.screenshot({ path: file });
    console.log(`[gallery] ${name}.${dark ? 'dark' : 'light'}.png`);
  }
}

await browser.close();
console.log(`[gallery] done → ${outDir}`);
