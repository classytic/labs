/**
 * Sizes come from the scale, not from taste.
 *
 * Before this, the stylesheets carried 79 distinct font sizes, 51 radii and 59 spacings (0.35rem,
 * 0.45rem, 0.55rem, 0.72rem…), because every lab picked its own. Nothing lined up with anything
 * else, which is what made a set of individually fine screens look homemade. The `--lab-t-*`,
 * `--lab-r-*` and `--lab-sp-*` tokens are the scale; this keeps new CSS on it.
 *
 * Exceptions, deliberately narrow:
 *   • 0, and any value inside calc()/min()/max()/clamp(), which are doing arithmetic, not sizing.
 *   • 1px and 2px, which are hairlines rather than spacing.
 *   • spacing above 32px and type above 26px, past the top of the scale (hero numerals, big gaps).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const STYLES = join(import.meta.dirname, '..', 'styles');

const PROPERTIES: Array<[RegExp, 'type' | 'radius' | 'space']> = [
  [/(?:^|[^-])font-size\s*:\s*([^;}]+)/g, 'type'],
  [/(?:^|[^-])border(?:-[a-z]+)?-radius\s*:\s*([^;}]+)/g, 'radius'],
  [/(?:^|[^-])(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:\s*([^;}]+)/g, 'space'],
];

const asPx = (raw: string): number | null => {
  const match = /^(-?[0-9]*\.?[0-9]+)(rem|px)$/.exec(raw);
  if (!match) return null;
  return match[2] === 'rem' ? +match[1]! * 16 : +match[1]!;
};

const offences = (css: string): string[] => {
  const found: string[] = [];
  // The token block declares the scale itself, so it is the one place raw values belong.
  const body = css.includes('/* elevation */') ? css.slice(css.indexOf('/* elevation */')) : css;
  for (const [pattern, kind] of PROPERTIES) {
    for (const match of body.matchAll(pattern)) {
      const value = match[1]!;
      if (/calc\(|min\(|max\(|clamp\(|env\(/.test(value)) continue;
      for (const part of value.trim().split(/\s+/)) {
        const px = asPx(part);
        if (px === null) continue;
        const size = Math.abs(px);
        if (size === 0 || size <= 2) continue;
        if (kind === 'space' && size > 32) continue;
        if (kind === 'type' && size > 26) continue;
        if (kind === 'radius' && size >= 90) continue;
        found.push(`${kind}: ${part}`);
      }
    }
  }
  return found;
};

describe('css scale', () => {
  const sheets = readdirSync(STYLES).filter((file) => file.endsWith('.css'));

  it.each(sheets)('%s sizes come from the token scale', (sheet) => {
    expect(offences(readFileSync(join(STYLES, sheet), 'utf8'))).toEqual([]);
  });

  it('the scale itself stays small enough to be a scale', () => {
    const core = readFileSync(join(STYLES, 'core.css'), 'utf8');
    const tokens = (prefix: string): number =>
      [...new Set([...core.matchAll(new RegExp(`--lab-${prefix}-[a-z0-9]+:`, 'g'))].map((m) => m[0]))].length;
    expect(tokens('t')).toBeLessThanOrEqual(8); // type steps
    expect(tokens('r')).toBeLessThanOrEqual(6); // radius steps
    expect(tokens('sp')).toBeLessThanOrEqual(12); // spacing steps
  });
});
