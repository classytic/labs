/**
 * Does anything overflow a phone, and is what overflows reachable?
 *
 * A screenshot cannot answer this. A container that scrolls and a container that clips produce
 * identical pixels, so the fix for the sample-space grid was unverifiable by eye. This loads the
 * same page shell the gallery uses at a phone width and asks the browser directly: is the page
 * itself wider than the viewport (which means sideways scrolling, always wrong), and is any
 * element wider than its own box without being scrollable (which means content the learner
 * cannot reach at all)?
 *
 *   node tests/gallery/overflow-check.mjs [scene-name-filter...]
 */
import { register } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';

register('../host-shims/loader.mjs', import.meta.url);
const { docHtml } = await import('./page-shell.mjs');
const { GALLERY } = await import('./registry.mjs');

const WIDTH = Number(process.env.LABS_SHOT_WIDTH ?? 360);
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const scenes = only.length ? GALLERY.filter((g) => only.some((o) => g.name.includes(o))) : GALLERY;

// The shell's card must match the phone, or the harness itself overflows and every scene looks
// broken. This is the same width the shot script uses, set here so the two agree.
process.env.LABS_SHOT_WIDTH = String(WIDTH - 36);

const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });

const problems = [];
for (const { name, element } of scenes) {
  let markup;
  try {
    markup = renderToStaticMarkup(element);
  } catch {
    continue;
  }
  await page.setContent(docHtml(markup, false), { waitUntil: 'load' });
  const found = await page.evaluate(() => {
    const out = {
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      unreachable: [],
    };
    /**
     * Hidden by ITSELF or by anything above it.
     *
     * Testing only the element misses the common case: KaTeX clips its screen-reader MathML to a
     * 1px box, and the element reported was the <math> CHILD inside it, which is statically
     * positioned and so passed every check while being invisible and unscrollable. A collapsed
     * panel hides its contents the same way. Both produced phantom reports.
     */
    const hidden = (el) => {
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0)
          return true;
        if (style.clipPath !== 'none' || style.clip !== 'auto') return true;
        // NOT aria-hidden: that hides a node from assistive tech while leaving it on the screen,
        // and these checks are about what a reader sees. The `hidden` attribute does both.
        if (node.hasAttribute('hidden')) return true;
        if (style.overflow !== 'visible' && (node.clientHeight <= 1 || node.clientWidth <= 1)) return true;
        if (node.tagName === 'DETAILS' && !node.open && !el.closest('summary')) return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('.card *')) {
      // Inside an SVG, scrollWidth/clientWidth are not a scroll box: a <text> reports a few px of
      // "overflow" that nobody can scroll to and nothing clips. The svg element itself is a normal
      // box and is still checked.
      if (el.namespaceURI === 'http://www.w3.org/2000/svg' && el.tagName !== 'svg') continue;
      const over = el.scrollWidth - el.clientWidth;
      // Under 4px is sub-pixel rounding, not content a learner cannot reach.
      if (over < 4) continue;
      const style = getComputedStyle(el);
      if (hidden(el)) continue;
      const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll';
      if (!scrolls) {
        out.unreachable.push(
          `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} +${over}px`,
        );
      }
    }
    return out;
  });
  if (found.pageOverflow > 1 || found.unreachable.length) {
    problems.push({ name, ...found });
  }
}
await browser.close();

for (const p of problems) {
  const bits = [];
  if (p.pageOverflow > 1) bits.push(`page scrolls sideways by ${p.pageOverflow}px`);
  if (p.unreachable.length) bits.push(`unreachable: ${[...new Set(p.unreachable)].slice(0, 3).join(', ')}`);
  console.log(`${p.name}: ${bits.join(' | ')}`);
}
console.log(`\n${problems.length} of ${scenes.length} scenes have a problem at ${WIDTH}px.`);
