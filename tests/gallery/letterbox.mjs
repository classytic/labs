/**
 * Gallery · LETTERBOX audit — finds scenes whose SVG is wasting horizontal space.
 *
 * An `<svg>` with a viewBox and an explicit CSS height scales its content to fit whichever
 * axis is limiting and centres the rest ("xMidYMid meet"). When the CSS box is WIDER than the
 * viewBox's own aspect, the drawing shrinks to the height and leaves dead gutters down both
 * sides: the apparatus and the chart then fight over a fraction of the width the lab actually
 * has. That is invisible in the markup and only shows up on screen.
 *
 *   node tests/gallery/letterbox.mjs physics chem     (dev server on :4001)
 *
 * Reports every scene losing more than `--min` percent (default 8) of its width, worst first.
 */
import { chromium } from 'playwright';

const base = process.env.LABS_LIVE_BASE ?? 'http://localhost:4001/stage-preview/';
const min = Number(process.argv.find((a) => a.startsWith('--min='))?.slice(6) ?? 8);
const routes = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!routes.length) {
  console.error('usage: node tests/gallery/letterbox.mjs <route> [route…] [--min=8]');
  process.exit(2);
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const rows = [];
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 180_000 });
  await page.waitForTimeout(1200);
  rows.push(
    ...(await page.evaluate(
      ({ route }) =>
        [...document.querySelectorAll('.lab-activity')].flatMap((lab) => {
          const heading = (lab.innerText.split('\n').find((l) => l.trim().length > 3) ?? '').trim();
          return [...lab.querySelectorAll('svg[viewBox]')].flatMap((svg) => {
            const box = svg.getBoundingClientRect();
            const vb = svg.viewBox.baseVal;
            if (!vb || !vb.width || !vb.height || box.width < 40 || box.height < 40) return [];
            if (svg.getAttribute('preserveAspectRatio') === 'none') return [];
            const drawn = Math.min(box.width / vb.width, box.height / vb.height) * vb.width;
            return [
              {
                route,
                heading: heading.slice(0, 46),
                cls: (svg.getAttribute('class') ?? svg.parentElement?.className ?? '')
                  .toString()
                  .slice(0, 40),
                lostPct: Math.round((1 - drawn / box.width) * 100),
                box: `${Math.round(box.width)}x${Math.round(box.height)}`,
                viewBox: `${Math.round(vb.width)}x${Math.round(vb.height)}`,
              },
            ];
          });
        }),
      { route },
    )),
  );
}
await browser.close();

const bad = rows.filter((r) => r.lostPct >= min).sort((a, b) => b.lostPct - a.lostPct);
console.log(`[letterbox] ${rows.length} scenes measured, ${bad.length} losing ≥ ${min}% of their width\n`);
for (const r of bad) {
  console.log(`  -${String(r.lostPct).padStart(2)}%  ${r.route}  ${r.heading}`);
  console.log(`         box ${r.box}  viewBox ${r.viewBox}  ${r.cls}`);
}
process.exitCode = 0;
