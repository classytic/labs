/**
 * Gallery · index map — prints `<index> <heading>` for every `.lab-activity` on a
 * /stage-preview/<route> page, so `live.mjs` PNG numbers can be matched to a lab by name.
 *
 *   node tests/gallery/list-labs.mjs physics
 */
import { chromium } from 'playwright';

const base = process.env.LABS_LIVE_BASE ?? 'http://localhost:4001/stage-preview/';
const routes = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!routes.length) {
  console.error('usage: node tests/gallery/list-labs.mjs <route> [route…]');
  process.exit(2);
}
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 180_000 });
  await page.waitForTimeout(1500);
  const labs = await page.$$('.lab-activity');
  console.log(`\n# ${route} (${labs.length} labs)`);
  for (let i = 0; i < labs.length; i++) {
    const heading = (await labs[i].innerText()).split('\n').find((l) => l.trim().length > 3) ?? '';
    console.log(`${route}-${i}\t${heading.trim().slice(0, 78)}`);
  }
}
await browser.close();
