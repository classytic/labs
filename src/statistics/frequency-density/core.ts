/**
 * Histograms with unequal class widths, where the bar HEIGHT is not the frequency.
 *
 * This is the one place in data presentation where the intuitive reading is the wrong one, and
 * where our own lessons were weakest: at A Level the topic was taught with a bar borrowed from a
 * linear-model lab, so the unequal-width histogram, the actual subject, was never drawn at all. A
 * learner was told "the 10 to 20 class is the shorter bar" and shown nothing to look at.
 *
 * The rule: on a histogram the FREQUENCY IS THE AREA of the bar. Area is height times width, so
 *
 *     height = frequency / width,   which is called the frequency density.
 *
 * Everything follows from that one substitution. A wide class spreads its frequency thinly, so a
 * class holding MORE values can be the SHORTER bar, which is the result nobody believes until they
 * see the same data drawn both ways.
 *
 * So this module deliberately computes both renderings. `bars(classes, 'frequency')` is the WRONG
 * picture, and it exists on purpose: showing the wrong one beside the right one is the only way the
 * difference becomes a thing you can see rather than a rule you are asked to trust.
 */

/** One class of a grouped distribution: everything above `from` and up to `to`. */
export interface Klass {
  from: number;
  to: number;
  frequency: number;
}

export const classWidth = (k: Klass): number => k.to - k.from;

/** Frequency per unit, which is what a histogram plots up the vertical axis. */
export const density = (k: Klass): number => k.frequency / classWidth(k);

export const totalFrequency = (classes: readonly Klass[]): number =>
  classes.reduce((sum, k) => sum + k.frequency, 0);

/** A bar ready to draw: where it starts, how wide, how tall, and what that height means. */
export interface Bar {
  from: number;
  to: number;
  width: number;
  height: number;
  frequency: number;
  /** Height times width. Equals the frequency only in the density rendering. */
  area: number;
}

/**
 * The bars under either rendering.
 *
 * 'density' is the correct histogram. 'frequency' is the mistake, drawn faithfully so a learner can
 * compare: it makes every bar as tall as its count regardless of how wide the class is, which
 * inflates wide classes and is exactly what an examiner is testing for.
 */
export function bars(classes: readonly Klass[], mode: 'density' | 'frequency'): Bar[] {
  return classes.map((k) => {
    const width = classWidth(k);
    const height = mode === 'density' ? density(k) : k.frequency;
    return { from: k.from, to: k.to, width, height, frequency: k.frequency, area: height * width };
  });
}

/**
 * Index of the tallest bar under each rendering.
 *
 * Returned as a pair because the whole lesson is that these two can disagree. When they do, the
 * data is worth teaching with; when they agree, the example is not making its point and an author
 * should pick different classes. `disagree` says which is which without the caller re-deriving it.
 */
export function tallest(classes: readonly Klass[]): {
  byDensity: number;
  byFrequency: number;
  disagree: boolean;
} {
  const pick = (mode: 'density' | 'frequency'): number => {
    const list = bars(classes, mode);
    let best = 0;
    for (let i = 1; i < list.length; i++) if (list[i]!.height > list[best]!.height) best = i;
    return best;
  };
  const byDensity = pick('density');
  const byFrequency = pick('frequency');
  return { byDensity, byFrequency, disagree: byDensity !== byFrequency };
}

/**
 * The modal class: the one with the greatest frequency DENSITY, not the greatest frequency.
 *
 * Worth its own function because the two definitions part company for exactly the data this lab is
 * about, and "modal class" is asked directly on papers. Reading it off the raw counts is the same
 * error as drawing the histogram with frequency up the axis.
 */
export const modalClass = (classes: readonly Klass[]): Klass | null =>
  classes.length ? classes[tallest(classes).byDensity]! : null;

/** Authoring mistakes worth catching before a learner meets them. */
export function densityProblems(classes: readonly Klass[]): string[] {
  const problems: string[] = [];
  if (classes.length < 2) problems.push('a histogram needs at least two classes');
  for (const [i, k] of classes.entries()) {
    if (classWidth(k) <= 0) problems.push(`class ${i + 1} ends at or before it starts`);
    if (k.frequency < 0) problems.push(`class ${i + 1} has a negative frequency`);
    const next = classes[i + 1];
    if (next && next.from !== k.to)
      problems.push(`class ${i + 1} ends at ${k.to} but class ${i + 2} starts at ${next.from}`);
  }
  // A set of equal-width classes is a legal histogram and a pointless teaching example: with every
  // width the same, height and frequency rank identically and the lesson has nothing to show.
  if (classes.length > 1 && new Set(classes.map(classWidth)).size === 1)
    problems.push('every class is the same width, so frequency and density give the same picture');
  return problems;
}
