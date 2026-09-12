import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import {
  alignFor,
  isAligned,
  logOffset,
  productOf,
  readingAt,
  snapOffset,
  valueAt,
} from '../../../../src/math/slide-rule/core.js';
import { SlideRuleLab } from '../../../../src/math/slide-rule/preset.js';
import manifest from '../../../../src/domains/math/slide-rule/manifest.js';
import Runtime from '../../../../src/domains/math/slide-rule/runtime.js';

const SPAN = 370;

describe('slide-rule geometry', () => {
  it('puts 1 at the start and 10 at the far end of one decade', () => {
    expect(logOffset(1, SPAN)).toBe(0);
    expect(logOffset(10, SPAN)).toBeCloseTo(SPAN, 8);
  });

  it('is the inverse of reading a position back off the scale', () => {
    for (const v of [1, 1.5, 2, 3.7, 6, 9.99]) {
      expect(valueAt(logOffset(v, SPAN), SPAN)).toBeCloseTo(v, 8);
    }
  });

  it('adds two lengths to multiply the values they mark', () => {
    // The whole point of the lab: set the upper 1 over a, read under its b, get a*b.
    for (const [a, b] of [
      [2, 3],
      [1.5, 4],
      [3, 3],
    ] as const) {
      expect(readingAt(alignFor(a, SPAN), b, SPAN)).toBeCloseTo(a * b, 6);
    }
  });

  it('places log a + log b at exactly the position of log ab', () => {
    expect(logOffset(2, SPAN) + logOffset(3, SPAN)).toBeCloseTo(logOffset(6, SPAN), 8);
  });

  it('reports a product past the end of the scale as digits plus a decade', () => {
    const off = productOf(4, 5);
    expect(off.product).toBe(20);
    expect(off.offScale).toBe(true);
    expect(off.decades).toBe(1);
    expect(off.mantissa).toBeCloseTo(2, 8);

    const on = productOf(2, 3);
    expect(on.offScale).toBe(false);
    expect(on.decades).toBe(0);
  });

  it('snaps a dragged offset onto a real tick', () => {
    const near2 = logOffset(2, SPAN) + 3;
    expect(valueAt(snapOffset(near2, SPAN), SPAN)).toBeCloseTo(2, 6);
  });

  it('only counts as lined up when the slide is actually at a', () => {
    expect(isAligned(alignFor(2, SPAN), 2, SPAN)).toBe(true);
    expect(isAligned(alignFor(2, SPAN) + 40, 2, SPAN)).toBe(false);
  });
});

describe('slide-rule lab', () => {
  it('accepts a blank insert and rejects a value off the decade', () => {
    expect(manifest.schema.safeParse({}).success).toBe(true);
    expect(manifest.schema.safeParse({ a: 99 }).success).toBe(false);
    expect(manifest.id).toBe('slide-rule');
    expect(manifest.tag).toBe('SlideRule');
  });

  it('renders through the runtime seam without dropping props', () => {
    const result = render(<div>{Runtime({ a: 2, b: 3, aligned: true })}</div>);
    expect(result.container.textContent).toContain('log 2');
    expect(result.container.textContent).toContain('log 3');
  });

  it('keeps the scale keyboard operable', () => {
    // jsdom cannot do a real pointer drag, so the arrow-key path is the one under
    // test, and it is also the accessibility path a learner may depend on.
    const result = render(<SlideRuleLab a={2} b={3} />);
    const handle = result.getByRole('slider', { name: 'Upper scale position' });
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    expect(handle.getAttribute('aria-valuetext')).toContain('over 1');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    const moved = result.getByRole('slider', { name: 'Upper scale position' });
    expect(Number(moved.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
    fireEvent.keyDown(moved, { key: 'ArrowLeft' });
    expect(result.getByRole('slider', { name: 'Upper scale position' }).getAttribute('aria-valuenow')).toBe(
      '0',
    );
  });

  it('offers the sum as a wrong answer, because that is the misconception', () => {
    const result = render(<SlideRuleLab a={2} b={3} />);
    // 5 is 2 + 3: the learner who thinks the values add rather than the lengths.
    expect(result.container.textContent).toContain('5');
    expect(result.container.textContent).toContain('6');
  });
});
