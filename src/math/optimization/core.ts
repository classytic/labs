export type GradientPoint = readonly [number, number];
export type DescentState = 'running' | 'converged' | 'diverged';

export interface GradientStepResult {
  point: [number, number];
  gradient: [number, number];
  magnitude: number;
  state: DescentState;
}

export interface GradientModel {
  fx: (x: number, y: number) => number;
  fy: (x: number, y: number) => number;
}

/** One guarded gradient-descent transition, shared by animation, manual stepping, and tests. */
export function gradientStep(
  model: GradientModel,
  point: GradientPoint,
  learningRate: number,
  tolerance = 1e-3,
  divergenceLimit = 1e3,
): GradientStepResult {
  const rate = Number.isFinite(learningRate) && learningRate > 0 ? learningRate : 0.1;
  const gx = model.fx(point[0], point[1]);
  const gy = model.fy(point[0], point[1]);
  const magnitude = Math.hypot(gx, gy);
  if (!(Number.isFinite(gx) && Number.isFinite(gy) && Number.isFinite(magnitude)))
    return { point: [point[0], point[1]], gradient: [gx, gy], magnitude, state: 'diverged' };
  if (magnitude <= tolerance)
    return { point: [point[0], point[1]], gradient: [gx, gy], magnitude, state: 'converged' };
  const next: [number, number] = [point[0] - rate * gx, point[1] - rate * gy];
  const state =
    Number.isFinite(next[0]) &&
    Number.isFinite(next[1]) &&
    Math.abs(next[0]) <= divergenceLimit &&
    Math.abs(next[1]) <= divergenceLimit
      ? 'running'
      : 'diverged';
  return { point: state === 'diverged' ? [point[0], point[1]] : next, gradient: [gx, gy], magnitude, state };
}

export function descentTrace(
  model: GradientModel,
  start: GradientPoint,
  learningRate: number,
  maxSteps = 250,
): { path: [number, number][]; state: DescentState | 'max-steps' } {
  const path: [number, number][] = [[start[0], start[1]]];
  for (let index = 0; index < Math.max(1, Math.floor(maxSteps)); index++) {
    const result = gradientStep(model, path[path.length - 1]!, learningRate);
    if (result.state !== 'running') return { path, state: result.state };
    path.push(result.point);
  }
  return { path, state: 'max-steps' };
}
