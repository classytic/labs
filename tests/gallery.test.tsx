/**
 * Gallery · SVG geometry snapshots — the deterministic, zero-dependency half of
 * the visual harness. Each registered scene is rendered to static SVG markup and
 * snapshotted to tests/gallery/__svg__/<name>.svg. Because every emitted pixel
 * coordinate goes through the engine's `fmt()` (SSR-stable to 3dp), a snapshot
 * diff is a REAL geometry/representation change, not float noise — so this is a
 * fast regression guard for glyph work that runs in CI with no browser.
 *
 * For pixel-faithful visual judging (themes, gradients, color-mix), use the PNG
 * gallery: `npm run gallery` (Playwright). Extend both at once by adding to
 * tests/gallery/registry.mjs.
 *
 * KaTeX is normalised out (see `stripTex`): `<Tex>` renders inside a
 * `<foreignObject>`, and KaTeX's HTML is huge, version-sensitive, and — under
 * happy-dom's quirks mode — flips between fully-rendered and a raw-LaTeX fallback
 * run to run. That's noise for a GEOMETRY snapshot, so we keep the foreignObject's
 * box (the geometry we actually guard) and collapse its volatile inner markup to a
 * stable token. Maths rendering is judged in the PNG gallery instead.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GALLERY } from './gallery/registry.mjs';

/** Collapse KaTeX/Tex output to a stable token, preserving foreignObject geometry. */
const stripTex = (svg: string): string =>
  svg.replace(/(<foreignObject\b[^>]*>)[\s\S]*?(<\/foreignObject>)/g, '$1<tex/>$2');

describe('gallery · svg geometry snapshots', () => {
  for (const { name, element } of GALLERY) {
    it(name, async () => {
      const html = renderToStaticMarkup(element);
      const raw = (html.match(/<svg[\s\S]*?<\/svg>/) ?? [html])[0]!;
      expect(raw.length).toBeGreaterThan(100); // a real figure rendered, not an empty shell
      await expect(stripTex(raw)).toMatchFileSnapshot(`./gallery/__svg__/${name}.svg`);
    });
  }
});
