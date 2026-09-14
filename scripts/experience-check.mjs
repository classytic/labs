/** Browser reflow smoke test for representative shipped activities. */
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';

// Register the same minimal host shadcn contract used by package and gallery checks before
// importing any built lab. A static registry import is resolved before this module executes,
// which left `@/components/ui/*` unresolved in a bare Node process.
register('../tests/host-shims/loader.mjs', import.meta.url);
const { GALLERY } = await import('../tests/gallery/registry.mjs');

const root = resolve(import.meta.dirname, '..');
const css = [
  readFileSync(resolve(root, '../stage/styles.css'), 'utf8'),
  readFileSync(resolve(root, 'styles/core.css'), 'utf8'),
  readFileSync(resolve(root, 'styles/domains.css'), 'utf8'),
  readFileSync(resolve(root, 'styles/commerce.css'), 'utf8'),
].join('\n');
const representatives = [
  'balance-algebra',
  'heating-curve',
  'waves-travelling',
  'circuit',
  'word-match',
  'central-dogma',
];
const scenes = representatives.map((name) => {
  const scene = GALLERY.find((candidate) => candidate.name === name);
  if (!scene) throw new Error(`Missing experience-check scene: ${name}`);
  return scene;
});

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 320, height: 720 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
const failures = [];

for (const { name, element } of scenes) {
  await page.setViewportSize({ width: 320, height: 720 });
  const markup = renderToStaticMarkup(element);
  await page.setContent(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>${css}\n*{box-sizing:border-box}html,body{margin:0;max-width:100%;background:var(--background);color:var(--foreground)}body{padding:4px}:root{--background:white;--foreground:#18181b;--card:white;--muted:#f4f4f5;--muted-foreground:#71717a;--border:#e4e4e7;--primary:#2563eb;--primary-foreground:white;--ring:#2563eb;--success:#159447}</style></head><body><main>${markup}</main></body></html>`,
  );
  const result = await page.evaluate(() => {
    const root = document.querySelector('.lab-activity');
    const buttons = [...document.querySelectorAll('.lab-activity button:not([disabled])')];
    const undersized = buttons
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      })
      .map((button) => ({
        label: button.getAttribute('aria-label') || button.textContent?.trim() || 'button',
        rect: button.getBoundingClientRect().toJSON(),
      }));
    return {
      hasActivity: Boolean(root),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      undersized,
      animated: [...document.querySelectorAll('.lab-activity *')]
        .filter((node) => {
          const style = getComputedStyle(node);
          return style.animationName !== 'none' && style.animationDuration !== '0s';
        })
        .map((node) => node.className || node.tagName)
        .slice(0, 8),
    };
  });
  if (!result.hasActivity) failures.push(`${name}: missing canonical Activity root`);
  if (result.overflow > 1) failures.push(`${name}: ${result.overflow}px horizontal overflow at 320px`);
  if (result.undersized.length)
    failures.push(
      `${name}: undersized controls ${result.undersized
        .map((item) => `${item.label} (${Math.round(item.rect.width)}×${Math.round(item.rect.height)})`)
        .join(', ')}`,
    );
  if (result.animated.length)
    failures.push(`${name}: animations remain under reduced motion (${result.animated.join(', ')})`);

  await page.setViewportSize({ width: 640, height: 720 });
  const zoomOverflow = await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  if (zoomOverflow > 1) failures.push(`${name}: ${zoomOverflow}px horizontal overflow at 200% zoom`);
}

await browser.close();
if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  process.exit(1);
}
console.log(
  `✓ experience reflow passed — ${scenes.length} representative activities at 320 CSS px and 200% zoom, 44px controls, and reduced motion`,
);
