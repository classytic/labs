import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2];
const out = process.argv[3];
mkdirSync(out, { recursive: true });
const COURSE = "/8bitlesson/learn/cambridge-a2-level-physics-9702";
const START = `${base}${COURSE}/the-radian`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

// ── 1. Scroll progress actually advances ─────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(START, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(2000);
  const read = () =>
    page.evaluate(() => {
      const el = document.querySelector("[data-fluid-scroll-progress] > *") ??
        document.querySelector("[data-fluid-scroll-progress]");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { w: Math.round(r.width), transform: cs.transform, scaleX: cs.scale };
    });
  const before = await read();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
  await page.waitForTimeout(900);
  const after = await read();
  const moved = before && after && JSON.stringify(before) !== JSON.stringify(after);
  check("scroll progress advances on scroll", !!moved, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  await ctx.close();
}

// ── 2. Keyboard nav moves lessons ────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(START, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(2000);
  const from = page.url();
  await page.locator("body").click({ position: { x: 5, y: 400 } });
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(1800);
  check("ArrowRight advances a lesson", page.url() !== from, `${from.split("/").pop()} -> ${page.url().split("/").pop()}`);

  const mid = page.url();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(1800);
  check("ArrowLeft goes back", page.url() !== mid && page.url() === from, page.url().split("/").pop());
  await ctx.close();
}

// ── 3. Arrow keys inside a lab must NOT navigate ─────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(START, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(2500);
  const lab = page.locator(".lab-activity").first();
  const hasLab = (await lab.count()) > 0;
  if (!hasLab) {
    check("lab present to test against", false, "no .lab-activity on this lesson");
  } else {
    const before = page.url();
    // Focus something inside the lab, then fire the key from that element.
    await page.evaluate(() => {
      const root = document.querySelector(".lab-activity");
      const focusable = root.querySelector(
        'button, [tabindex]:not([tabindex="-1"]), input, [role="slider"]',
      );
      (focusable ?? root).setAttribute("tabindex", "0");
      (focusable ?? root).focus();
    });
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1500);
    check("ArrowRight inside a lab does NOT navigate", page.url() === before, page.url().split("/").pop());
  }
  await ctx.close();
}

// ── 4. Mobile outline sheet: scrolls, and closes on navigate ─────────
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(START, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(2200);
  await page.getByLabel("Course outline").click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(out, "mob-sheet-open.png") });

  const scrollable = await page.evaluate(() => {
    const nav = document.querySelector('[role="dialog"] nav[aria-label="Outline"]');
    if (!nav) return { found: false };
    let el = nav.parentElement;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        return { found: true, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
      }
      el = el.parentElement;
    }
    return { found: false, note: "no scrollable ancestor with overflow" };
  });
  check("mobile outline sheet has a working scroll region", !!scrollable.found, JSON.stringify(scrollable));

  // Reach a lesson far down the tree.
  const lastLink = page.locator('[role="dialog"] a[href*="/learn/"]').last();
  const target = await lastLink.getAttribute("href");
  await lastLink.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, "mob-sheet-scrolled.png") });
  await lastLink.click();
  await page.waitForTimeout(2200);
  const dialogGone = (await page.locator('[role="dialog"]').count()) === 0 ||
    !(await page.locator('[role="dialog"]').first().isVisible());
  check("sheet closes after tapping a lesson", dialogGone, `now at ${page.url().split("/").pop()}`);
  check("tapped lesson actually navigated", page.url().endsWith(target ?? "#"), target ?? "");
  await page.screenshot({ path: join(out, "mob-after-nav.png") });
  await ctx.close();
}

// ── 5. Cross-chapter nav expands + scrolls the rail, not the window ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(START, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(2200);

  // Open a later chapter and click a lesson inside it.
  const laterChapter = page
    .locator('aside [data-fluid-outline-branch="true"]')
    .filter({ hasText: "Capacitance" })
    .first();
  await laterChapter.getByText("Capacitance").click();
  await page.waitForTimeout(700);
  const deepLink = page.locator('aside a[href*="/learn/"]').last();
  const href = await deepLink.getAttribute("href");
  const scrollYBefore = await page.evaluate(() => window.scrollY);
  await deepLink.click();
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => {
    const rail = document.querySelector("aside");
    const scroller = rail?.querySelector(".overflow-y-auto");
    const cur = rail?.querySelector('[data-fluid-outline-current="true"]');
    if (!scroller || !cur) return { ok: false, hasCur: !!cur, hasScroller: !!scroller };
    const sr = scroller.getBoundingClientRect();
    const cr = cur.getBoundingClientRect();
    return {
      ok: true,
      inView: cr.top >= sr.top - 2 && cr.bottom <= sr.bottom + 2,
      scrollTop: Math.round(scroller.scrollTop),
      windowScrollY: Math.round(window.scrollY),
    };
  });
  check("current lesson is visible inside the rail after cross-chapter nav", !!state.inView, JSON.stringify(state));
  check("window did not scroll as a side effect", state.windowScrollY === 0, `scrollY=${state.windowScrollY}, was ${scrollYBefore}`);
  await page.screenshot({ path: join(out, "desk-cross-chapter.png") });
  await ctx.close();
}

await browser.close();
console.log(`\n${results.join("\n")}`);
