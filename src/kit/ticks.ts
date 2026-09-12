/**
 * Which numbers on a hand-drawn number line get printed.
 *
 * The 1-D counterpart of the stage's `Axes keepClear`. Several labs draw their own number line, and
 * each puts something that moves ON the line: a mean fulcrum, a bound handle, a balance point. The
 * tick number under it was printed anyway and came out half-covered, most often exactly where the
 * learner is looking. Here a tick's number is placed only if it lands clear of every kept-clear span
 * and of the numbers already placed, so crowded ticks thin out instead of overprinting each other.
 */

export interface TickMark<T = number> {
  /** Position along the line, in px. */
  at: number;
  text: string;
  value: T;
}

/** A stretch of the line the numbers must leave clear, as a centre and half-width in px. */
export interface ClearSpan {
  at: number;
  half: number;
}

/** Roughly how wide a number renders, in px: digits average a little over half an em. */
const widthOf = (text: string, size: number): number => text.length * size * 0.58;

/** The ticks whose number can be printed, in their original order. */
export function clearTicks<T>(
  ticks: readonly TickMark<T>[],
  keepClear: readonly ClearSpan[] = [],
  size = 11,
): TickMark<T>[] {
  const taken: [number, number][] = keepClear.map((s) => [s.at - s.half, s.at + s.half]);
  const kept: TickMark<T>[] = [];
  for (const tick of ticks) {
    const half = widthOf(tick.text, size) / 2 + 2;
    const span: [number, number] = [tick.at - half, tick.at + half];
    if (taken.some(([l, r]) => span[0] < r && l < span[1])) continue;
    taken.push(span);
    kept.push(tick);
  }
  return kept;
}
