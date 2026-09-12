import { describe, expect, it } from 'vitest';
import {
  bars,
  classWidth,
  density,
  densityProblems,
  modalClass,
  tallest,
  totalFrequency,
  type Klass,
} from '../src/statistics/frequency-density/core.js';

/** The rainfall classes our A Level lesson uses, where a bigger count is a shorter bar. */
const RAIN: Klass[] = [
  { from: 0, to: 5, frequency: 10 },
  { from: 5, to: 10, frequency: 6 },
  { from: 10, to: 20, frequency: 8 },
  { from: 20, to: 50, frequency: 6 },
];

describe('height is frequency divided by width', () => {
  it('gives the four densities the lesson quotes', () => {
    expect(RAIN.map(density)).toEqual([2, 1.2, 0.8, 0.2]);
    expect(RAIN.map(classWidth)).toEqual([5, 5, 10, 30]);
    expect(totalFrequency(RAIN)).toBe(30);
  });

  it('makes the AREA of every bar equal its frequency', () => {
    // This is the defining property. If it fails, the picture is not a histogram.
    for (const bar of bars(RAIN, 'density')) expect(bar.area).toBeCloseTo(bar.frequency, 9);
  });

  it('does NOT make area equal frequency in the wrong rendering', () => {
    // The frequency rendering is drawn on purpose, so pin that it really is wrong: a 30-wide class
    // holding 6 values would claim an area of 180.
    const wrong = bars(RAIN, 'frequency');
    expect(wrong.at(-1)!.area).toBe(180);
    expect(wrong.at(-1)!.frequency).toBe(6);
  });
});

describe('the result nobody believes', () => {
  it('makes a class holding MORE values the SHORTER bar', () => {
    // 10 to 20 holds 8 days; 5 to 10 holds only 6. Yet 10 to 20 is the shorter bar, because it
    // spreads its days over twice the width.
    const [, fiveToTen, tenToTwenty] = bars(RAIN, 'density');
    expect(tenToTwenty!.frequency).toBeGreaterThan(fiveToTen!.frequency);
    expect(tenToTwenty!.height).toBeLessThan(fiveToTen!.height);
  });

  it('has the two renderings disagree about the tallest bar', () => {
    const t = tallest(RAIN);
    expect(t.byDensity).toBe(0); // 0 to 5, density 2
    expect(t.byFrequency).toBe(0); // also 0 to 5, count 10
    expect(t.disagree).toBe(false);
  });

  it('finds data where they do disagree, which is what the lab needs', () => {
    // A wide class with the largest raw count but a small density. Plotting frequency would call
    // the last class the mode; the histogram calls the first one.
    const skewed: Klass[] = [
      { from: 0, to: 5, frequency: 12 },
      { from: 5, to: 30, frequency: 20 },
    ];
    const t = tallest(skewed);
    expect(t.byFrequency).toBe(1); // 20 beats 12
    expect(t.byDensity).toBe(0); // 2.4 per unit beats 0.8 per unit
    expect(t.disagree).toBe(true);
  });

  it('takes the modal class from density, not from the raw count', () => {
    const skewed: Klass[] = [
      { from: 0, to: 5, frequency: 12 },
      { from: 5, to: 30, frequency: 20 },
    ];
    expect(modalClass(skewed)).toEqual({ from: 0, to: 5, frequency: 12 });
    expect(modalClass([])).toBeNull();
  });
});

describe('authoring checks', () => {
  it('passes well-formed unequal classes', () => {
    expect(densityProblems(RAIN)).toEqual([]);
  });

  it('rejects equal widths, which would teach nothing', () => {
    // Not an error in the data, but an error in the EXAMPLE: with equal widths the wrong picture
    // and the right one are identical, so the lesson has nothing to point at.
    expect(
      densityProblems([
        { from: 0, to: 10, frequency: 5 },
        { from: 10, to: 20, frequency: 9 },
      ]),
    ).toContain('every class is the same width, so frequency and density give the same picture');
  });

  it('catches a gap between classes and a backwards class', () => {
    expect(
      densityProblems([
        { from: 0, to: 5, frequency: 4 },
        { from: 8, to: 20, frequency: 6 },
      ]),
    ).toContain('class 1 ends at 5 but class 2 starts at 8');
    expect(densityProblems([{ from: 10, to: 4, frequency: 1 }])).toContain(
      'class 1 ends at or before it starts',
    );
  });
});
