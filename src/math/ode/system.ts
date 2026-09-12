import type { OdeMethod } from './core.js';

export interface PhasePoint {
  x: number;
  y: number;
  t: number;
}
export interface PhaseDerivative {
  dx: number;
  dy: number;
}
export type PhaseField = (x: number, y: number, t: number) => PhaseDerivative;
export interface PhaseSolution {
  points: PhasePoint[];
  state: 'complete' | 'diverged' | 'step-limit';
}

const finiteDerivative = (value: PhaseDerivative): boolean =>
  Number.isFinite(value.dx) && Number.isFinite(value.dy);

export function phaseStep(
  field: PhaseField,
  point: PhasePoint,
  step: number,
  method: OdeMethod,
): PhasePoint | null {
  if (![point.x, point.y, point.t, step].every(Number.isFinite) || step === 0) return null;
  const k1 = field(point.x, point.y, point.t);
  if (!finiteDerivative(k1)) return null;
  if (method === 'euler') {
    const next = { x: point.x + step * k1.dx, y: point.y + step * k1.dy, t: point.t + step };
    return [next.x, next.y].every(Number.isFinite) ? next : null;
  }
  const k2 = field(point.x + (step * k1.dx) / 2, point.y + (step * k1.dy) / 2, point.t + step / 2);
  const k3 = finiteDerivative(k2)
    ? field(point.x + (step * k2.dx) / 2, point.y + (step * k2.dy) / 2, point.t + step / 2)
    : k2;
  const k4 = finiteDerivative(k3)
    ? field(point.x + step * k3.dx, point.y + step * k3.dy, point.t + step)
    : k3;
  if (![k2, k3, k4].every(finiteDerivative)) return null;
  const next = {
    x: point.x + (step * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx)) / 6,
    y: point.y + (step * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy)) / 6,
    t: point.t + step,
  };
  return [next.x, next.y, next.t].every(Number.isFinite) ? next : null;
}

function traceDirection(
  field: PhaseField,
  initial: PhasePoint,
  duration: number,
  stepSize: number,
  direction: 1 | -1,
  method: OdeMethod,
  maxSteps: number,
): PhaseSolution {
  const target = Math.abs(duration),
    points = [initial];
  let current = initial,
    elapsed = 0;
  for (let count = 0; count < maxSteps && elapsed < target - 1e-12; count++) {
    const next = phaseStep(field, current, direction * Math.min(stepSize, target - elapsed), method);
    if (!next || Math.max(Math.abs(next.x), Math.abs(next.y)) > 1e9) return { points, state: 'diverged' };
    points.push(next);
    elapsed += Math.abs(next.t - current.t);
    current = next;
  }
  return { points, state: elapsed >= target - 1e-12 ? 'complete' : 'step-limit' };
}

export function solvePhaseSystem(
  field: PhaseField,
  initial: Omit<PhasePoint, 't'> & { t?: number },
  duration: number,
  stepSize: number,
  method: OdeMethod = 'rk4',
  maxSteps = 5000,
): PhaseSolution {
  const start = { ...initial, t: initial.t ?? 0 };
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 8;
  const safeStep = Number.isFinite(stepSize) && stepSize > 0 ? stepSize : 0.1;
  const backward = traceDirection(field, start, safeDuration, safeStep, -1, method, maxSteps);
  const forward = traceDirection(field, start, safeDuration, safeStep, 1, method, maxSteps);
  const points = [...backward.points.slice(1).reverse(), ...forward.points];
  const state =
    backward.state === 'diverged' || forward.state === 'diverged'
      ? 'diverged'
      : backward.state === 'step-limit' || forward.state === 'step-limit'
        ? 'step-limit'
        : 'complete';
  return { points, state };
}
