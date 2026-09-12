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

/**
 * React `useId()` values (`_R_lmk_`, `«r3»`) encode the component's position in the tree, so
 * any wrapper added to shared chrome renames every gradient/marker id in every scene. That is
 * not geometry — normalise the ids so snapshots only move when the drawing does.
 */
const stripIds = (svg: string): string => svg.replace(/(?:_R_[a-z0-9]+_|«[^»]*»)/g, '_R_id_');

describe('gallery · svg geometry snapshots', () => {
  for (const { name, element } of GALLERY) {
    it(name, async () => {
      const html = renderToStaticMarkup(element);
      // Gallery snapshots guard educational scene geometry, not shared shell chrome. Keeping the
      // focus affordance out also lets HTML/CSS scenes retain their existing full-scene snapshots.
      const sceneHtml = html
        .replace(/<button\b[^>]*class="[^"]*lab-activity-focus[^"]*"[^>]*>[\s\S]*?<\/button>/g, '')
        // Live-region metadata is a shared behavior contract, not scene geometry.
        // Normalize it so accessibility improvements do not rewrite visual fixtures.
        .replace(
          /class="lab-activity-status" role="status" aria-live="polite" aria-atomic="false"/g,
          'class="lab-activity-status"',
        );
      // Snapshot the SCENE svg, not a decorative control icon. Full labs wrap the scene in an
      // Activity header whose focus/play/reset buttons render `aria-hidden` <svg> icons BEFORE the
      // scene — so grab the first NON-decorative <svg> (the Stage scene carries role + aria-label).
      const svgs = sceneHtml.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
      // Some scenes are deliberately HTML/CSS rather than SVG. In that case retain the full
      // rendered lab snapshot; never fall back to a decorative transport/focus icon.
      const raw = svgs.find((s) => !s.includes('aria-hidden="true"')) ?? sceneHtml;
      expect(raw.length).toBeGreaterThan(100); // a real figure rendered, not an empty shell
      await expect(stripIds(stripTex(raw))).toMatchFileSnapshot(`./gallery/__svg__/${name}.svg`);
    });
  }
});
