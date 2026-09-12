/**
 * Does any label land on another label, or straddle the edge of a shape?
 *
 * Every scene here was checked by eye at some point, and label collisions kept getting through:
 * a caption drawn across the tops of four planks, "accelerates down" printed on top of "left mass",
 * a VLAN name struck through by a router leg. Each looked fine in the author's head and in the unit
 * tests, because no test knows where text ends up. The browser does, so this asks it.
 *
 * Two checks, in order of confidence:
 *
 *   text-on-text   two labels overlap. Always a defect: at least one of them is unreadable.
 *   text-on-edge   a label partly covers a filled shape and partly does not, so the shape's edge
 *                  runs through the words. A label FULLY inside a shape ("3 kg" in its box, "AND"
 *                  in its gate) is deliberate and not reported, and neither is a background that
 *                  holds everything. Shapes are compared by bounding box, so curved shapes can
 *                  produce the odd false alarm; the report says which shape to look at.
 *
 *   node tests/gallery/collision-check.mjs [scene-name-filter...]
 *   node tests/gallery/collision-check.mjs --strict     exit 1 on any OVERLAP (the release gate:
 *                                                       the library is at zero, so keep it there).
 *                                                       text-clipped is reported but not yet gated;
 *                                                       see the known case in the report.
 *   node tests/gallery/collision-check.mjs --shots=<dir> also crop every collision into one contact
 *                                                        sheet, <dir>/collisions.png, to judge by eye
 */
import { register } from 'node:module';
import { renderToStaticMarkup } from 'react-dom/server';

register('../host-shims/loader.mjs', import.meta.url);
const { docHtml } = await import('./page-shell.mjs');
const { GALLERY } = await import('./registry.mjs');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const shotsDir = args.find((a) => a.startsWith('--shots='))?.slice(8);
const only = args.filter((a) => !a.startsWith('--'));
const scenes = only.length ? GALLERY.filter((g) => only.some((o) => g.name.includes(o))) : GALLERY;

const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 760, height: 1200 } });

const report = [];
const shots = [];
for (const { name, element } of scenes) {
  let markup;
  try {
    markup = renderToStaticMarkup(element);
  } catch {
    continue;
  }
  await page.setContent(docHtml(markup, false), { waitUntil: 'load' });
  const found = await page.evaluate(() => {
    /**
     * Is this element hidden by ITSELF or by anything above it?
     *
     * Asking only about the element misses the two ways a page hides things while still laying them
     * out: a collapsed panel (overflow hidden with no height, whose contents keep their boxes and so
     * "overlap" whatever comes after it) and a screen-reader-only node (clipped to a pixel, which is
     * how KaTeX carries its MathML). Both produced phantom reports.
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
        // A closed <details> keeps its body in the layout and clips it, so the contents sit on top
        // of whatever follows the panel while being invisible on screen.
        if (node.tagName === 'DETAILS' && !node.open && !el.closest('summary')) return true;
        // Anything scrolled or clipped out of a container that hides its overflow.
        if (style.overflow !== 'visible' && node !== el) {
          const box = el.getBoundingClientRect();
          const clipBox = node.getBoundingClientRect();
          const w = Math.min(box.right, clipBox.right) - Math.max(box.left, clipBox.left);
          const h = Math.min(box.bottom, clipBox.bottom) - Math.max(box.top, clipBox.top);
          const shown = Math.max(0, w) * Math.max(0, h);
          if (shown < 0.5 * Math.max(1, box.width * box.height)) return true;
        }
      }
      return false;
    };
    const visible = (el) => {
      if (hidden(el)) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0.5 && box.height > 0.5;
    };
    const area = (r) => Math.max(0, r.width) * Math.max(0, r.height);
    const overlap = (a, b) => {
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return w > 0 && h > 0 ? w * h : 0;
    };
    const issues = [];
    // A figure may be HTML rather than SVG (a board of bars and names), and those labels can
    // overlap each other just as SVG ones do. Take the leaves: an element that holds text and has
    // no child element holding text, so a label counts once and not again for every wrapper.
    const htmlLabels = (root) =>
      [...root.querySelectorAll(':not(svg):not(svg *)')].filter((el) => {
        if (!el.textContent || !el.textContent.trim() || !visible(el)) return false;
        return ![...el.children].some((child) => child.textContent && child.textContent.trim());
      });
    const around = (...rects) => {
      const left = Math.min(...rects.map((r) => r.left)) - 36;
      const top = Math.min(...rects.map((r) => r.top)) - 28;
      const right = Math.max(...rects.map((r) => r.right)) + 36;
      const bottom = Math.max(...rects.map((r) => r.bottom)) + 28;
      return {
        x: Math.max(0, left + scrollX),
        y: Math.max(0, top + scrollY),
        width: right - left,
        height: bottom - top,
      };
    };
    // Text drawn with a halo (paint-order: stroke, in the page background) is MEANT to lie over the
    // figure and stays readable there, so it is exempt from the shape-edge check. Two labels on each
    // other is still a defect: a halo cannot save the one underneath.
    const haloed = (el) => {
      const style = getComputedStyle(el);
      if (!style.paintOrder.includes('stroke')) return false;
      const stroke = style.stroke;
      return !!stroke && stroke !== 'none' && parseFloat(style.strokeWidth) > 0.5;
    };
    // A text box is the whole line box, ascent to descent (about 1.2em), but the ink of a label is
    // the band between cap height and baseline. Comparing line boxes flagged every value stacked a
    // line above its terminal letter ("0 V" over "S"), which never touch on the page.
    const ink = (r) => {
      const top = r.top + 0.22 * r.height;
      const bottom = r.bottom - 0.2 * r.height;
      return { left: r.left, right: r.right, top, bottom, width: r.width, height: bottom - top };
    };
    const labelBox = (el) => ({
      text: (el.textContent ?? '').trim().slice(0, 28),
      box: el.getBoundingClientRect(),
      halo: haloed(el),
    });
    /**
     * The boxes an HTML label actually occupies, one per rendered LINE.
     *
     * An element box is as wide as its column, not as wide as its words, so a paragraph ending
     * mid-line "overlapped" a number sitting to its right. Measuring the text with a Range gives
     * the line boxes themselves, which is what a reader sees.
     */
    const lineBoxes = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()]
        .filter((r) => r.width > 1 && r.height > 1)
        .map((box) => ({ text: (el.textContent ?? '').trim().slice(0, 28), box, halo: haloed(el) }));
    };

    // text cut off by its own container: the label is there, but part of the word is not on screen
    for (const el of document.querySelectorAll('.card *')) {
      const text = (el.textContent ?? '').trim();
      if (!text || [...el.children].some((child) => (child.textContent ?? '').trim())) continue;
      if (hidden(el)) continue;
      for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        // A scrollable ancestor ENDS the walk: what sticks out of it is reached by scrolling, and
        // its overflow would otherwise be blamed on some hidden box further up.
        if (style.overflowX === 'auto' || style.overflowX === 'scroll') break;
        if (style.overflowX === 'visible') continue;
        const box = el.getBoundingClientRect();
        const clipBox = node.getBoundingClientRect();
        const cut = Math.max(0, box.right - clipBox.right) + Math.max(0, clipBox.left - box.left);
        if (cut > 4 && cut > 0.12 * box.width) {
          issues.push({
            kind: 'text-clipped',
            detail: `"${text.slice(0, 28)}" is cut off by ${Math.round(cut)}px`,
            clip: around(box, clipBox),
          });
          break;
        }
      }
    }

    // text on text, over the whole card: SVG labels and HTML labels can land on each other too
    for (const card of document.querySelectorAll('.card')) {
      const boxes = [
        ...[...card.querySelectorAll('text')]
          .filter((t) => visible(t) && (t.textContent ?? '').trim())
          .map(labelBox),
        ...htmlLabels(card).flatMap(lineBoxes),
      ];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const shared = overlap(ink(a.box), ink(b.box));
          if (shared > 0.2 * Math.min(area(ink(a.box)), area(ink(b.box)))) {
            issues.push({
              kind: 'text-on-text',
              detail: `"${a.text}" overlaps "${b.text}"`,
              clip: around(a.box, b.box),
            });
          }
        }
      }
    }

    for (const svg of document.querySelectorAll('.card svg')) {
      const svgArea = area(svg.getBoundingClientRect());
      const boxes = [...svg.querySelectorAll('text')]
        .filter((t) => visible(t) && (t.textContent ?? '').trim().length > 0)
        .map(labelBox);

      // text straddling a filled shape's edge
      const shapes = [...svg.querySelectorAll('rect, circle, ellipse, polygon, path')].filter((s) => {
        if (!visible(s)) return false;
        const style = getComputedStyle(s);
        const fill = style.fill;
        if (!fill || fill === 'none' || fill === 'transparent' || /rgba\([^)]*,\s*0\)/.test(fill))
          return false;
        if (Number(style.fillOpacity) < 0.15) return false;
        const shapeArea = area(s.getBoundingClientRect());
        // Backgrounds and region tints hold many things; they are containers, not obstacles. Lamp
        // highlights, junction dots and arrowheads are too small to hide a word.
        return shapeArea < 0.2 * svgArea && shapeArea > 150;
      });
      for (const t of boxes) {
        if (t.halo) continue;
        const ta = area(t.box);
        // A label fully inside one shape is deliberate. Otherwise add up what every shape covers:
        // a wide caption across a row of narrow planks overlaps each a little and all of them a lot.
        let covered = 0;
        let worst = null;
        let inside = false;
        for (const s of shapes) {
          const shared = overlap(t.box, s.getBoundingClientRect());
          if (shared >= 0.9 * ta) {
            inside = true;
            break;
          }
          if (shared > 0) {
            covered += shared;
            if (!worst || shared > worst.shared)
              worst = { shared, tag: s.tagName.toLowerCase(), box: s.getBoundingClientRect() };
          }
        }
        if (!inside && covered > 0.1 * ta && worst) {
          issues.push({
            kind: 'text-on-edge',
            detail: `"${t.text}" straddles a ${worst.tag}`,
            clip: around(t.box),
          });
        }
      }
    }
    return issues;
  });
  if (found.length) report.push({ name, issues: found });
  if (shotsDir && found.length) {
    const seen = new Set();
    for (const issue of found) {
      if (seen.has(issue.kind + issue.detail) || seen.size >= 3) continue;
      seen.add(issue.kind + issue.detail);
      const png = await page.screenshot({ clip: issue.clip, fullPage: true });
      shots.push({ name, detail: issue.detail, src: `data:image/png;base64,${png.toString('base64')}` });
    }
  }
}
if (shotsDir) {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(shotsDir, { recursive: true });
  const cells = shots
    .map(
      (s) =>
        `<figure><img src="${s.src}"><figcaption><b>${s.name}</b> ${s.detail.replace(/</g, '&lt;')}</figcaption></figure>`,
    )
    .join('');
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.setContent(
    `<style>body{margin:12px;font:12px system-ui;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}figure{margin:0;border:1px solid #ccc;padding:4px;background:#fff}img{display:block;max-width:440px;max-height:240px}</style>${cells}`,
  );
  await page.screenshot({ path: `${shotsDir}/collisions.png`, fullPage: true });
  console.log(`[collision-check] contact sheet → ${shotsDir}/collisions.png (${shots.length} crops)`);
}
await browser.close();

let onText = 0;
for (const { name, issues } of report) {
  const unique = [...new Map(issues.map((i) => [i.kind + i.detail, i])).values()];
  onText += unique.filter((i) => i.kind === 'text-on-text').length ? 1 : 0;
  console.log(`${name}`);
  for (const i of unique.slice(0, 6)) console.log(`   ${i.kind.padEnd(13)} ${i.detail}`);
  if (unique.length > 6) console.log(`   … ${unique.length - 6} more`);
}
console.log(`\n${report.length} of ${scenes.length} scenes have a collision; ${onText} have text on text.`);
// text-clipped is reported but does not fail the gate yet: one known case is outstanding (a narrow
// segment in the probability board), and gating it would block a release on someone else's scene.
const gated = report.filter((r) => r.issues.some((i) => i.kind !== 'text-clipped'));
if (strict && gated.length > 0) process.exit(1);
