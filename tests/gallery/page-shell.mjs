/**
 * The gallery's page shell: the self-contained HTML document a rendered scene is screenshotted in.
 *
 * Extracted from rasterize.mjs so more than one tool can produce a pixel-faithful shot. The
 * stylesheets, the host token definitions and the shadcn approximations all have to match the
 * real app, and a second copy of them would drift and quietly start lying.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const labsRoot = join(here, '..', '..');
/** Read a stylesheet and inline its relative `@import "./x.css";` lines recursively — the
 *  markup is handed to the browser as a string, so a relative @import has no base to resolve. */
const readCssInlined = (file) =>
  readFileSync(file, 'utf8').replace(/^\s*@import\s+["']([^"']+)["'];?\s*$/gm, (m, rel) =>
    rel.startsWith('.') ? readCssInlined(join(dirname(file), rel)) : m,
  );
const stageCss = readCssInlined(join(labsRoot, '..', 'stage', 'styles.css'));
const labsCss = readCssInlined(join(labsRoot, 'styles.css'));
// KaTeX CSS with woff2 fonts inlined — Tex now SSR-renders KaTeX markup, so the
// gallery must carry the stylesheet to display it faithfully (file:// font urls
// are blocked in setContent, so base64 them).
let katexCss = '';
try {
  const katexDir = join(labsRoot, 'node_modules', 'katex', 'dist');
  katexCss = readFileSync(join(katexDir, 'katex.min.css'), 'utf8').replace(
    /url\(fonts\/([^)]+\.woff2)\)/g,
    (m, file) => {
      try {
        return `url(data:font/woff2;base64,${readFileSync(join(katexDir, 'fonts', file)).toString('base64')})`;
      } catch {
        return m;
      }
    },
  );
} catch {
  /* katex absent — Tex falls back to raw text */
}

const docHtml = (
  markup,
  dark,
) => `<!doctype html><html class="${dark ? 'dark' : ''}"><head><meta charset="utf-8">
<style>
${katexCss}
${stageCss}
${labsCss}
/* Host semantic tokens (shadcn-shaped) the labs' --lab-* map onto. The real app defines these
   per theme; the harness must too, or --lab-* fall back to LIGHT defaults in dark mode and the
   dark PNG lies. Light on :root, dark on .dark (class beats :root, so dark wins under <html.dark>). */
:root{--background:oklch(1 0 0);--foreground:oklch(0.21 0.01 260);--card:oklch(1 0 0);--muted:oklch(0.965 0.004 260);--muted-foreground:oklch(0.55 0.02 260);--accent:oklch(0.965 0.004 260);--border:oklch(0.92 0.005 260);--ring:oklch(0.55 0.16 262);--primary:oklch(0.55 0.16 262);--primary-foreground:oklch(1 0 0);--secondary:oklch(0.96 0.005 260);--success:oklch(0.58 0.15 152);--destructive:oklch(0.58 0.2 27);}
.dark{--background:oklch(0.19 0.012 265);--foreground:oklch(0.96 0.005 260);--card:oklch(0.205 0.014 265);--muted:oklch(0.27 0.012 265);--muted-foreground:oklch(0.70 0.02 260);--accent:oklch(0.27 0.012 265);--border:oklch(0.30 0.012 265);--ring:oklch(0.64 0.16 262);--primary:oklch(0.64 0.16 262);--primary-foreground:oklch(0.19 0.012 265);--secondary:oklch(0.27 0.012 265);--success:oklch(0.68 0.15 152);--destructive:oklch(0.68 0.2 27);}
*{box-sizing:border-box}
/* The slice of Tailwind preflight the host applies and the labs CSS relies on. */
fieldset{margin:0;padding:0;border:0;min-width:0}legend{padding:0}button,input,select,textarea{font:inherit;color:inherit}
/* The host's shadcn Button variants, approximated so the harness shows the same affordances
   (the shims emit data-variant / data-size instead of Tailwind classes). */
button[data-variant]{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;min-height:2.25rem;padding:.4rem .85rem;border:1px solid var(--border);border-radius:.6rem;background:var(--background);color:var(--foreground);font-size:.875rem;font-weight:500;cursor:pointer}
button[data-variant="default"]{border-color:transparent;background:var(--primary);color:var(--primary-foreground)}
button[data-variant="secondary"]{border-color:transparent;background:var(--secondary);color:var(--foreground)}
button[data-variant="ghost"]{border-color:transparent;background:transparent}
button[data-size="sm"]{min-height:1.85rem;padding:.25rem .65rem;font-size:.8rem}
button[data-size="icon-sm"]{min-height:1.85rem;min-width:1.85rem;padding:.25rem}
button[data-variant]:disabled{opacity:.5;cursor:not-allowed}
/* Same for the shadcn Input: without this a text box paints browser-default white and the dark
   PNG lies about a lab that asks the learner to type. */
input[data-slot="input"]{min-height:2.25rem;padding:.4rem .7rem;border:1px solid var(--border);border-radius:.6rem;background:transparent;color:var(--foreground);font-size:.875rem}
input[data-slot="input"]::placeholder{color:var(--muted-foreground)}
input[data-slot="input"]:disabled{opacity:.5;cursor:not-allowed}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:${dark ? '#0c0e13' : '#f4f5f7'};color:var(--foreground);}
.wrap{display:inline-block;padding:18px}
.card{width:${process.env.LABS_SHOT_WIDTH ?? '684'}px;padding:22px;border-radius:16px;background:var(--card);box-shadow:0 1px 3px rgba(0,0,0,.12);}
.tag{font:600 12px ui-monospace,monospace;opacity:.5;margin:0 0 10px}
</style></head>
<body><div class="wrap"><div class="card"><p class="tag">${dark ? 'dark' : 'light'}</p>${markup}</div></div></body></html>`;

export { docHtml };
