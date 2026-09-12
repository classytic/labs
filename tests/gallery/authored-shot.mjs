/**
 * authored-shot — screenshot a lab as a LESSON actually authored it.
 *
 * The gallery renders each lab from a scene we wrote, which is the lab at its most flattering:
 * short strings, few rows, values chosen to look good. A real lesson is not that. It has six
 * parts, prompts that wrap, and mark schemes that run long, and the only way to know that still
 * reads is to render the authored props rather than our own.
 *
 *   node tests/gallery/authored-shot.mjs <path to .mdx> [TagName] [--name=<file>]
 *
 * Reads the first matching JSX tag in the file, evaluates its attributes (the house style allows
 * only a quoted string or a braced JS literal, so this is the same reading `check:props` does),
 * and shoots it light and dark into tests/gallery/png/.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';

register('../host-shims/loader.mjs', import.meta.url);
const { docHtml } = await import('./page-shell.mjs');
const { labRuntimeLoaders, labTags } = await import('../../dist/domains/render-map.mjs');

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'png');
mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const arg = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const positional = args.filter((a) => !a.startsWith('--'));
const file = positional[0];
if (!file) {
  console.error('usage: node tests/gallery/authored-shot.mjs <file.mdx> [TagName] [--name=out]');
  process.exit(2);
}
const source = readFileSync(resolve(file), 'utf8');

/** The opening tag and its attribute text, for the first tag we can render. */
function findTag(wanted) {
  const re = /<([A-Z][A-Za-z0-9]*)\s([\s\S]*?)\/>/g;
  for (const m of source.matchAll(re)) {
    if (wanted && m[1] !== wanted) continue;
    if (!wanted && !byTag.has(m[1])) continue;
    return { tag: m[1], attrs: m[2] };
  }
  return null;
}

const byTag = new Map(Object.entries(labTags).map(([id, tag]) => [tag, id]));
const found = findTag(positional[1]);
if (!found) {
  console.error(`[authored] no renderable lab tag found in ${basename(file)}`);
  process.exit(1);
}

/** Read JSX attributes: `name="text"` or `name={<js literal>}`. Our own repo, not user input. */
function readAttrs(raw) {
  const out = {};
  const re = /([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(?:"([^"]*)"|\{)/g;
  let m;
  while ((m = re.exec(raw))) {
    if (m[2] !== undefined) {
      out[m[1]] = m[2];
      continue;
    }
    // Walk to the matching brace, then evaluate what is inside it.
    let depth = 1;
    let i = re.lastIndex;
    while (i < raw.length && depth > 0) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') depth--;
      i++;
    }
    const body = raw.slice(re.lastIndex, i - 1);
    out[m[1]] = new Function(`return (${body});`)();
    re.lastIndex = i;
  }
  return out;
}

const attrs = readAttrs(found.attrs);

// `--no-gate` drops the prediction question, purely so the authored content BEHIND the gate can
// be inspected. A predict-first lab renders its lock screen and nothing else in a static shot, so
// without this the formula, derivation and tricks an author wrote cannot be seen at all, which is
// exactly the half most likely to carry mangled LaTeX. This is an inspection view, never a
// publishing one: the shot is labelled so nobody mistakes it for what a learner meets.
const gated = args.includes('--no-gate') && attrs.challenge !== undefined;
if (gated) delete attrs.challenge;

const mod = await labRuntimeLoaders[byTag.get(found.tag)]();
const Component = mod.default ?? mod[found.tag];
const markup = renderToStaticMarkup((await import('react')).createElement(Component, attrs));

const name = (arg('name') ?? `authored-${basename(file).replace(/\.mdx$/, '')}`) + (gated ? '.ungated' : '');
if (gated) console.log('[authored] prediction gate bypassed for inspection: this is NOT the learner view');
const { chromium } = await import('playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 760, height: 1400 }, deviceScaleFactor: 2 });
for (const dark of [false, true]) {
  await page.setContent(docHtml(markup, dark), { waitUntil: 'load' });
  const card = await page.$('.card');
  const out = join(outDir, `${name}.${dark ? 'dark' : 'light'}.png`);
  await card.screenshot({ path: out });
  console.log(`[authored] ${found.tag} from ${basename(file)} → ${basename(out)}`);
}
await browser.close();
