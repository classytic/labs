/**
 * The design system holds: roles, motion, state tints, focus and reduced motion come from tokens.
 *
 * `css-scale.test.ts` guards the sizes. This guards everything else the system decided once so
 * that it stays decided: four weights, four leadings, two trackings, three durations, three
 * curves, one state-tint vocabulary, three layers, one focus ring, one reduced-motion policy.
 * See docs/DESIGN-SYSTEM.md for why each of those is the number it is.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STYLES = join(import.meta.dirname, '..', 'styles');
const sheets = readdirSync(STYLES).filter((file) => file.endsWith('.css'));
const read = (sheet: string): string => {
  const css = readFileSync(join(STYLES, sheet), 'utf8');
  // The token block declares the system; everything after it must use it.
  return css.includes('/* elevation */') ? css.slice(css.indexOf('/* elevation */')) : css;
};

const declarations = (css: string, property: string): string[] =>
  [...css.matchAll(new RegExp(`(?:^|[^-])${property}\\s*:\\s*([^;}]+)`, 'g'))].map((m) => m[1]!.trim());

describe('css system', () => {
  it.each(sheets)('%s: font-weight is a role token', (sheet) => {
    const raw = declarations(read(sheet), 'font-weight').filter((v) => /^[0-9]+$/.test(v));
    expect(raw).toEqual([]);
  });

  it.each(sheets)('%s: line-height is a role token (or a deliberate outlier above 1.75)', (sheet) => {
    const raw = declarations(read(sheet), 'line-height').filter((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0.9 && n <= 1.75;
    });
    expect(raw).toEqual([]);
  });

  it.each(sheets)('%s: letter-spacing is caps, tight or 0', (sheet) => {
    const raw = declarations(read(sheet), 'letter-spacing').filter((v) => /em$/.test(v));
    expect(raw).toEqual([]);
  });

  it.each(sheets)('%s: transitions use the motion tokens', (sheet) => {
    // A raw duration of 400ms or less belongs to the scale; longer is scene physics and may stay.
    const offenders: string[] = [];
    for (const value of declarations(read(sheet), 'transition')) {
      // Tokens are what we want to see; strip them so `var(--lab-ease)` cannot read as `ease`.
      const bare = value.replace(/var\(--[a-z0-9-]+\)/g, '');
      for (const match of bare.matchAll(/(^|\s)([0-9.]+)(m?s)\b/g)) {
        const ms = match[3] === 's' ? +match[2]! * 1000 : +match[2]!;
        if (ms > 0 && ms <= 400) offenders.push(value);
      }
      if (/\b(ease|ease-in|ease-out|ease-in-out)\b/.test(bare) || /cubic-bezier/.test(bare))
        offenders.push(value);
    }
    expect(offenders).toEqual([]);
  });

  it.each(sheets)('%s: z-index is a layer token', (sheet) => {
    const raw = declarations(read(sheet), 'z-index').filter((v) => /^[0-9]+$/.test(v));
    expect(raw).toEqual([]);
  });

  it.each(sheets)('%s: state tints come from the tint tokens', (sheet) => {
    // A semantic colour mixed at a low percentage toward the surface or transparent IS a state tint
    // and has a token; a mix toward the foreground is ink, also a token. Other mixes are allowed.
    const raw = [
      ...read(sheet).matchAll(
        /color-mix\(in oklab, var\(--lab-(accent|good|danger)\) ([0-9]+)%, (transparent|var\(--lab-surface\))\)/g,
      ),
    ]
      .filter((m) => +m[2]! <= 18)
      .map((m) => m[0]);
    expect(raw).toEqual([]);
  });

  it('honours reduced motion once, at the root', () => {
    const core = readFileSync(join(STYLES, 'core.css'), 'utf8');
    const blocks = core.match(/@media \(prefers-reduced-motion: reduce\)/g) ?? [];
    // The shared policy plus the pin, whose reduced state is heavier rather than still.
    expect(blocks.length).toBeLessThanOrEqual(2);
    expect(core).toContain('animation-duration: 0.01ms !important');
    for (const sheet of sheets.filter((s) => s !== 'core.css')) {
      expect(read(sheet)).not.toContain('prefers-reduced-motion');
    }
  });

  it('draws one focus ring, and only SVG geometry may draw its own', () => {
    const core = readFileSync(join(STYLES, 'core.css'), 'utf8');
    expect(core).toContain('outline: var(--lab-focus-ring)');
    // Any other :focus-visible rule must not restate an outline; it may stroke geometry instead.
    const rules = [...core.matchAll(/([^{}]+:focus-visible[^{}]*)\{([^{}]*)\}/g)];
    const restated = rules.filter(
      ([, sel, body]) => !sel.includes('--lab-focus-ring') && /outline:\s*2px/.test(body),
    );
    expect(restated.map(([, sel]) => sel.trim())).toEqual([]);
  });

  // A touch device keeps :hover on the last element tapped, so a hover that repaints a surface
  // leaves that element looking active after the finger has moved on. On an answer list that is
  // not cosmetic: the choice hover was an accent border over an accent-faint fill, the same thing
  // PICKED looks like, so tapping A and moving to B left A still looking chosen. Most of these
  // learners are on a phone, so it was the common case. Removing paint (`none`) is a reset and is
  // always fine; adding it needs a real pointer.
  it('keeps surface-painting hover behind a real pointer', () => {
    const core = readFileSync(join(STYLES, 'core.css'), 'utf8');
    const gated: Array<[number, number]> = [];
    for (const open of core.matchAll(/@media \(hover: hover\)[^{]*\{/g)) {
      let depth = 1;
      let i = open.index + open[0].length;
      while (i < core.length && depth > 0) {
        if (core[i] === '{') depth += 1;
        else if (core[i] === '}') depth -= 1;
        i += 1;
      }
      gated.push([open.index, i]);
    }
    const SURFACE = ['background', 'background-color', 'box-shadow', 'border-color', 'border'];
    // Split into declarations rather than matching the body: `\s*(?!none)` backtracks over the
    // space and passes `box-shadow: none`, which is the one case that must NOT count.
    const paints = (body: string): boolean =>
      body.split(';').some((decl) => {
        const [prop, ...rest] = decl.split(':');
        return SURFACE.includes(prop.trim()) && rest.join(':').trim().replace(/!important/, '').trim() !== 'none';
      });
    const sticky = [...core.matchAll(/([^{}]*:hover[^{}]*)\{([^{}]*)\}/g)]
      .filter((rule) => !gated.some(([from, to]) => rule.index >= from && rule.index < to))
      .filter((rule) => paints(rule[2]))
      .map((rule) => rule[1].trim().replace(/\s+/g, ' '));
    expect(sticky).toEqual([]);
  });

  it('exports the same tokens the CSS declares', () => {
    const tokens = JSON.parse(readFileSync(join(STYLES, '..', 'design-tokens.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    expect(tokens.$schema).toContain('designtokens.org');
    const motion = tokens.motion as { duration: Record<string, { $value: { value: number } }> };
    expect(motion.duration.fast!.$value.value).toBe(120);
    expect(motion.duration.slow!.$value.value).toBe(260);
  });
});
