/**
 * Whatever the author sets, the correct tile is on screen.
 *
 * GeoTransform's enlarge and rotate modes used to offer a fixed set of tiles (2/3/4 and
 * 90/180/270) while the schema accepts any number for `k` and `deg`. So `k={5}` passed the schema,
 * passed check:props, and shipped an activity the learner could not solve, because the right answer
 * was not among the choices and nothing anywhere said so. This asserts the property that was
 * missing: the answer is always offered.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { TransformLab } from '../dist/math/transform/preset.mjs';

/** The answer tiles a learner can press, read off their accessible names. */
const tilesOf = (props: Record<string, unknown>): string[] =>
  [...renderToStaticMarkup(createElement(TransformLab, props)).matchAll(/aria-label="tile ([^"]+)"/g)].map(
    ([, label]) => label,
  );

describe('geo-transform answer tiles', () => {
  it.each([2, 3, 4, 5, 10, 0.5])('enlarge k=%s is offered', (k) => {
    expect(tilesOf({ transform: { kind: 'enlarge', k } })).toContain(String(k));
  });

  it.each([45, 60, 90, 180, 270])('rotate deg=%s is offered', (deg) => {
    expect(tilesOf({ transform: { kind: 'rotate', deg } })).toContain(`${deg}°`);
  });

  it('keeps the familiar choices as distractors', () => {
    // k = 5 should not turn the question into "is it 5?"; 2, 3 and 4 stay on the board.
    expect(tilesOf({ transform: { kind: 'enlarge', k: 5 } })).toEqual(['2', '3', '4', '5']);
    expect(tilesOf({ transform: { kind: 'rotate', deg: 45 } })).toEqual(['45°', '90°', '180°', '270°']);
  });

  it('leaves the default cases exactly as they were', () => {
    expect(tilesOf({ transform: { kind: 'enlarge', k: 2 } })).toEqual(['2', '3', '4']);
    expect(tilesOf({ transform: { kind: 'rotate', deg: 90 } })).toEqual(['90°', '180°', '270°']);
  });
});
