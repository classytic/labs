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

import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { GALLERY } from './registry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const labsRoot = join(here, '..', '..');
const stageCss = readFileSync(join(labsRoot, '..', 'stage', 'styles.css'), 'utf8');
const labsCss = readFileSync(join(labsRoot, 'styles.css'), 'utf8');
// KaTeX CSS with woff2 fonts inlined — Tex now SSR-renders KaTeX markup, so the
// gallery must carry the stylesheet to display it faithfully (file:// font urls
// are blocked in setContent, so base64 them).
let katexCss = '';
try {
  const katexDir = join(labsRoot, 'node_modules', 'katex', 'dist');
  katexCss = readFileSync(join(katexDir, 'katex.min.css'), 'utf8')
    .replace(/url\(fonts\/([^)]+\.woff2)\)/g, (m, file) => {
      try { return `url(data:font/woff2;base64,${readFileSync(join(katexDir, 'fonts', file)).toString('base64')})`; }
      catch { return m; }
    });
} catch { /* katex absent — Tex falls back to raw text */ }
const outDir = join(here, 'png');
mkdirSync(outDir, { recursive: true });

const docHtml = (markup, dark) => `<!doctype html><html class="${dark ? 'dark' : ''}"><head><meta charset="utf-8">
<style>
${katexCss}
${stageCss}
${labsCss}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:${dark ? '#0c0e13' : '#f4f5f7'};color:${dark ? '#e8eaed' : '#1a1c1f'};}
.wrap{display:inline-block;padding:18px}
.card{width:684px;padding:22px;border-radius:16px;background:${dark ? '#15171c' : '#ffffff'};box-shadow:0 1px 3px rgba(0,0,0,.12);}
.tag{font:600 12px ui-monospace,monospace;opacity:.5;margin:0 0 10px}
</style></head>
<body><div class="wrap"><div class="card"><p class="tag">${dark ? 'dark' : 'light'}</p>${markup}</div></div></body></html>`;

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
