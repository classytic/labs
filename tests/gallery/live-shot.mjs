/**
 * Live screenshot of a running lab on the host dev server — the ONLY way to judge
 * canvas/animated labs (the static rasterizer has no React runtime). Navigates to
 * a route, lets the animation run, and screenshots cards by their <h2> title.
 * Usage: node tests/gallery/live-shot.mjs <url> "<h2 title>" <out.png> [runMs]
 */
import { chromium } from 'playwright';

const [url, heading, out, runMs = '3500'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
const section = page.locator('section', { has: page.locator('h2', { hasText: heading }) }).first();
await section.waitFor({ state: 'visible', timeout: 60000 });
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(Number(runMs));   // let the sim run
await section.screenshot({ path: out });
console.log(`[live-shot] ${out}`);
await browser.close();
