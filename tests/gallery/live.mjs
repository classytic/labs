/**
 * Gallery · LIVE screenshots — the other half of the visual harness, for what static
 * SSR cannot show: WebGL (`src/three/*`) scenes, hydrated interactions, and the host's
 * real shadcn/Tailwind chrome. Drives the running mentora dev server (apps/web on :4001)
 * and screenshots every `.lab-activity` on the given /stage-preview/<route> pages.
 *
 *   node tests/gallery/live.mjs biology physics   → tests/gallery/live/<route>-<i>.png
 *
 * Headless Chrome with SwiftShader so R3F canvases render without a GPU.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.LABS_LIVE_BASE ?? 'http://localhost:4001/stage-preview/';
// `--dark` renders under prefers-color-scheme: dark (next-themes "system" follows it).
const dark = process.argv.includes('--dark');
// `--match=<text>` screenshots only labs whose text contains it (case-insensitive).
const match = process.argv
  .find((arg) => arg.startsWith('--match='))
  ?.slice(8)
  .toLowerCase();
const routes = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (!routes.length) {
  console.error('usage: node tests/gallery/live.mjs <route> [route…]   (e.g. biology physics)');
  process.exit(2);
}
const out = join(dirname(fileURLToPath(import.meta.url)), 'live');
mkdirSync(out, { recursive: true });

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
const page = await (
  await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: dark ? 'dark' : 'light',
  })
).newPage();
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 180_000 });
  await page.waitForTimeout(2500);
  const labs = await page.$$('.lab-activity');
  console.log(`[live] ${route}: ${labs.length} labs`);
  for (let i = 0; i < labs.length; i++) {
    await labs[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500); // deferred WebGL mount + first frame
    if (match && !(await labs[i].innerText()).toLowerCase().includes(match)) continue;
    const file = join(out, `${route}-${i}${dark ? '-dark' : ''}.png`);
    await labs[i].screenshot({ path: file });
    console.log(`[live]   ${file}`);
  }
}
await browser.close();
