export type NewtonState = 'running' | 'converged' | 'flat-derivative' | 'diverged' | 'cycle' | 'max-steps';

export interface NewtonIteration {
  x: number;
  fx: number;
  slope: number;
  nextX: number;
  error: number;
  state: Exclude<NewtonState, 'cycle' | 'max-steps'>;
}

export function newtonStep(
  fn: (x: number) => number,
  derivative: (x: number) => number,
  x: number,
  tolerance = 1e-7,
  limit = 1e6,
): NewtonIteration {
  const fx = fn(x);
  const slope = derivative(x);
  if (!(Number.isFinite(x) && Number.isFinite(fx) && Number.isFinite(slope)))
    return { x, fx, slope, nextX: x, error: Number.POSITIVE_INFINITY, state: 'diverged' };
  if (Math.abs(fx) <= tolerance) return { x, fx, slope, nextX: x, error: Math.abs(fx), state: 'converged' };
  if (Math.abs(slope) <= 1e-12)
    return { x, fx, slope, nextX: x, error: Math.abs(fx), state: 'flat-derivative' };
  const nextX = x - fx / slope;
  if (!Number.isFinite(nextX) || Math.abs(nextX) > limit)
    return { x, fx, slope, nextX: x, error: Math.abs(fx), state: 'diverged' };
  return { x, fx, slope, nextX, error: Math.abs(fx), state: 'running' };
}

export function newtonTrace(
  fn: (x: number) => number,
  derivative: (x: number) => number,
  start: number,
  maxSteps = 20,
  tolerance = 1e-7,
): { iterations: NewtonIteration[]; state: NewtonState; root: number } {
  const iterations: NewtonIteration[] = [];
  const seen: number[] = [];
  let x = start;
  for (let index = 0; index < Math.max(1, Math.floor(maxSteps)); index++) {
    const iteration = newtonStep(fn, derivative, x, tolerance);
    iterations.push(iteration);
    if (iteration.state !== 'running') return { iterations, state: iteration.state, root: iteration.nextX };
    if (
      seen.some((value) => Math.abs(value - iteration.nextX) <= tolerance * (1 + Math.abs(iteration.nextX)))
    )
      return { iterations, state: 'cycle', root: iteration.nextX };
    seen.push(x);
    x = iteration.nextX;
  }
  return { iterations, state: 'max-steps', root: x };
}
