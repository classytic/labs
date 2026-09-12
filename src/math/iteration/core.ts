/**
 * Solving an equation by iterating x -> F(x), and the picture that says whether it will work.
 *
 * The examinable method is: rearrange f(x) = 0 into x = F(x), pick a starting value, and feed each
 * answer back in. What no page explains well is why one rearrangement of the SAME equation marches
 * straight to the root while another flies off to infinity. A learner is told to "use the given
 * iteration" and never finds out what makes it a good one.
 *
 * The answer is a single number: the gradient of F at the root.
 *
 *     |F'(root)| < 1  converges, and the smaller it is the faster
 *     |F'(root)| > 1  diverges, from any starting point except the root itself
 *     F'(root) < 0    the approach alternates either side; positive means it creeps up one side
 *
 * That is what the cobweb draws. Each step goes VERTICALLY to the curve y = F(x), then HORIZONTALLY
 * to the line y = x, which is the act of feeding the output back in as the next input. A shallow
 * curve traps the path in a shrinking box; a steep one throws it outward in a widening staircase.
 *
 * So this module returns the path as well as the numbers, because the numbers alone cannot show a
 * learner why the method they were handed happens to work.
 */

/** One step of the sequence, with the value that produced it. */
export interface Step {
  n: number;
  x: number;
  /** F(x), which becomes the next x. */
  next: number;
}

export type Outcome = 'converged' | 'diverged' | 'running';

export interface Run {
  steps: Step[];
  outcome: Outcome;
  /** The value it settled on, when it converged. */
  root: number | null;
}

/** Anything this big is treated as escaped: a diverging iteration overflows fast. */
const ESCAPED = 1e6;

/**
 * Iterate until the value stops moving, or until it clearly will not.
 *
 * Convergence is decided on the CHANGE between successive values rather than on how close F(x) is
 * to x, because that is the test a candidate actually applies in the exam: keep going until the
 * answer stops changing at the required number of decimal places.
 */
export function run(F: (x: number) => number, x0: number, maxSteps = 20, tolerance = 5e-7): Run {
  const steps: Step[] = [];
  let x = x0;
  for (let n = 0; n < maxSteps; n++) {
    const next = F(x);
    if (!Number.isFinite(next) || Math.abs(next) > ESCAPED) {
      steps.push({ n, x, next: Number.isFinite(next) ? next : Number.NaN });
      return { steps, outcome: 'diverged', root: null };
    }
    steps.push({ n, x, next });
    if (Math.abs(next - x) < tolerance) return { steps, outcome: 'converged', root: next };
    x = next;
  }
  // Ran out of steps without settling. Whether it was heading somewhere is a separate question, so
  // this is reported as still running rather than as a failure.
  return { steps, outcome: 'running', root: null };
}

/**
 * The cobweb path: vertical to the curve, horizontal to the line, repeated.
 *
 * Returned as one polyline because that is what makes it read as a single journey rather than a
 * scatter of segments. The first point sits on the x-axis at the starting value, so the very first
 * vertical stroke is visibly "evaluate F at x0".
 */
export function cobweb(steps: readonly Step[]): { x: number; y: number }[] {
  if (!steps.length) return [];
  const path = [{ x: steps[0]!.x, y: 0 }];
  for (const step of steps) {
    if (!Number.isFinite(step.next)) break;
    path.push({ x: step.x, y: step.next }); // up (or down) to the curve
    path.push({ x: step.next, y: step.next }); // across to the line y = x
  }
  return path;
}

/**
 * The gradient of F at a point, by central difference.
 *
 * Numerical rather than symbolic on purpose: F is authored as an expression string and may be
 * anything the parser accepts, so differentiating it symbolically would restrict what a lesson can
 * teach with. The step is large enough to survive floating point and small enough that the answer
 * is right to about six figures.
 */
export function gradientAt(F: (x: number) => number, x: number, h = 1e-5): number {
  const a = F(x - h);
  const b = F(x + h);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.NaN;
  return (b - a) / (2 * h);
}

export interface Verdict {
  gradient: number;
  converges: boolean;
  alternates: boolean;
  why: string;
}

/** Why this rearrangement behaves the way it does, in the words a learner can repeat. */
export function verdict(F: (x: number) => number, near: number): Verdict {
  const gradient = gradientAt(F, near);
  const size = Math.abs(gradient);
  const alternates = gradient < 0;
  if (!Number.isFinite(gradient))
    return { gradient, converges: false, alternates: false, why: 'F cannot be evaluated near this point.' };
  if (size < 1)
    return {
      gradient,
      converges: true,
      alternates,
      why: alternates
        ? `The gradient of F is ${gradient.toFixed(2)}, between −1 and 0, so each step overshoots and the values close in from alternate sides.`
        : `The gradient of F is ${gradient.toFixed(2)}, between 0 and 1, so each step shrinks the error and the values creep up from one side.`,
    };
  return {
    gradient,
    converges: false,
    alternates,
    why: `The gradient of F is ${gradient.toFixed(2)}, and any size above 1 multiplies the error at every step, so the sequence is pushed away from the root.`,
  };
}

/**
 * Whether f changes sign across an interval, which is how a root is located in the first place.
 *
 * Deliberately reports the two values as well as the answer: an exam requires them to be QUOTED,
 * and a bare "yes there is a root" earns nothing.
 */
export function signChange(
  f: (x: number) => number,
  a: number,
  b: number,
): {
  fa: number;
  fb: number;
  changes: boolean;
} {
  const fa = f(a);
  const fb = f(b);
  return { fa, fb, changes: Number.isFinite(fa) && Number.isFinite(fb) && fa * fb < 0 };
}

/** Authoring mistakes worth catching before a learner meets them. */
export function iterationProblems(F: (x: number) => number, x0: number, near: number): string[] {
  const problems: string[] = [];
  if (!Number.isFinite(F(x0))) problems.push('F cannot be evaluated at the starting value');
  if (!Number.isFinite(F(near))) problems.push('F cannot be evaluated near the expected root');
  // A fixed point is the whole premise: if F(near) is nowhere near `near`, the author has given a
  // rearrangement whose fixed point is somewhere else, and every number on screen will mislead.
  if (Number.isFinite(F(near)) && Math.abs(F(near) - near) > 0.05)
    problems.push(
      `F(${near}) is ${F(near).toFixed(3)}, so ${near} is not a fixed point of this rearrangement`,
    );
  return problems;
}
