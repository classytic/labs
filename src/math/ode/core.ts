export type OdeMethod = 'euler' | 'rk4';
export interface OdePoint {
  x: number;
  y: number;
}
export interface OdeSolution {
  points: OdePoint[];
  state: 'complete' | 'diverged' | 'step-limit';
}

export function odeStep(
  slope: (x: number, y: number) => number,
  point: OdePoint,
  step: number,
  method: OdeMethod,
): OdePoint | null {
  const { x, y } = point;
  if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(step)) || step === 0) return null;
  if (method === 'euler') {
    const k = slope(x, y);
    const next = { x: x + step, y: y + step * k };
    return Number.isFinite(k) && Number.isFinite(next.y) ? next : null;
  }
  const k1 = slope(x, y);
  const k2 = slope(x + step / 2, y + (step * k1) / 2);
  const k3 = slope(x + step / 2, y + (step * k2) / 2);
  const k4 = slope(x + step, y + step * k3);
  const next = { x: x + step, y: y + (step * (k1 + 2 * k2 + 2 * k3 + k4)) / 6 };
  return [k1, k2, k3, k4, next.y].every(Number.isFinite) ? next : null;
}

function march(
  slope: (x: number, y: number) => number,
  initial: OdePoint,
  target: number,
  stepSize: number,
  method: OdeMethod,
  limit: number,
): OdeSolution {
  const direction = target >= initial.x ? 1 : -1;
  const points: OdePoint[] = [initial];
  let current = initial;
  for (let count = 0; count < limit && direction * (target - current.x) > 1e-10; count++) {
    const step = direction * Math.min(stepSize, Math.abs(target - current.x));
    const next = odeStep(slope, current, step, method);
    if (!next || Math.abs(next.y) > 1e9) return { points, state: 'diverged' };
    points.push(next);
    current = next;
  }
  return { points, state: direction * (target - current.x) <= 1e-10 ? 'complete' : 'step-limit' };
}

export function solveOde(
  slope: (x: number, y: number) => number,
  initial: OdePoint,
  range: readonly [number, number],
  stepSize: number,
  method: OdeMethod,
  maxSteps = 5000,
): OdeSolution {
  const h = Number.isFinite(stepSize) && stepSize > 0 ? stepSize : 0.2;
  const left = march(slope, initial, range[0], h, method, maxSteps);
  const right = march(slope, initial, range[1], h, method, maxSteps);
  const points = [...left.points.slice(1).reverse(), ...right.points];
  const state =
    left.state === 'diverged' || right.state === 'diverged'
      ? 'diverged'
      : left.state === 'step-limit' || right.state === 'step-limit'
        ? 'step-limit'
        : 'complete';
  return { points, state };
}

export function interpolateSolution(points: readonly OdePoint[], x: number): number {
  if (!points.length) return Number.NaN;
  if (x <= points[0]!.x) return points[0]!.y;
  if (x >= points[points.length - 1]!.x) return points[points.length - 1]!.y;
  let low = 0,
    high = points.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle]!.x <= x) low = middle;
    else high = middle;
  }
  const a = points[low]!,
    b = points[high]!;
  const t = (x - a.x) / (b.x - a.x);
  return a.y + t * (b.y - a.y);
}
