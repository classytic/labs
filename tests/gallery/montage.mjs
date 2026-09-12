/**
 * Contact-sheet montage — lays every gallery PNG of one theme into a labelled grid
 * and screenshots it, so a reviewer can eyeball the whole set at once. Splits into
 * pages of N tiles. Run after `npm run gallery`: `node tests/gallery/montage.mjs`.
 */
import { readdirSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// `--dir=live` sheets the live-server screenshots instead of the static gallery;
// `--filter=a,b` keeps file names containing EVERY substring (e.g. `--filter=physics-,-dark`).
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const pngDir = join(here, arg('dir') ?? 'png');
const filters = (arg('filter') ?? '').split(',').filter(Boolean);
const outDir = join(here, 'montage');
mkdirSync(outDir, { recursive: true });

const all = readdirSync(pngDir).filter((f) => f.endsWith('.png') && filters.every((x) => f.includes(x)));
const themes =
  (arg('dir') ?? 'png') === 'png'
    ? {
        light: all.filter((f) => f.endsWith('.light.png')),
        dark: all.filter((f) => f.endsWith('.dark.png')),
      }
    : {
        [`${filters.join('').replace(/[^a-z0-9]+/gi, '') || 'live'}${filters.some((x) => x.includes('dark')) ? '' : '-light'}`]:
          all.sort((a, b) => Number(a.match(/-(\d+)/)?.[1] ?? 0) - Number(b.match(/-(\d+)/)?.[1] ?? 0)),
      };
const PER_PAGE = 12;

const pw = await import('playwright');
const browser = await pw.chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });

for (const [theme, files] of Object.entries(themes)) {
  if ((arg('dir') ?? 'png') === 'png') files.sort();
  for (let p = 0; p * PER_PAGE < files.length; p++) {
    const chunk = files.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
    const tiles = chunk
      .map((f) => {
        const b64 = readFileSync(join(pngDir, f)).toString('base64');
        const name = f.replace(`.${theme}.png`, '').replace(/\.png$/, '');
        return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${name}</figcaption></figure>`;
      })
      .join('');
    const isDark = theme.includes('dark') || chunk.every((f) => f.includes('-dark'));
    const bg = isDark ? '#0c0e13' : '#f4f5f7';
    const fg = isDark ? '#e8eaed' : '#1a1c1f';
    const html = `<!doctype html><meta charset=utf-8><body style="margin:0;background:${bg};color:${fg};font-family:system-ui">
      <div style="display:flex;flex-wrap:wrap;gap:12px;padding:14px;align-items:flex-start">
      ${tiles
        .replace(/<figure>/g, '<figure style="margin:0;width:380px">')
        .replace(
          /<img /g,
          '<img width="380" style="display:block;width:380px;height:auto;border:1px solid #8884;border-radius:8px" ',
        )
        .replace(/<figcaption>/g, '<figcaption style="font:600 12px monospace;padding:4px 2px">')}
      </div></body>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const file = join(outDir, `sheet-${theme}-${p + 1}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`[montage] ${file}  (${chunk.length} tiles)`);
  }
}
await browser.close();
