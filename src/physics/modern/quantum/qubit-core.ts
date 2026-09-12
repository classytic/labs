export type MeasurementAxis = 'x' | 'y' | 'z';
export interface QubitState {
  theta: number;
  phi: number;
  x: number;
  y: number;
  z: number;
  alpha: { re: number; im: number };
  beta: { re: number; im: number };
}
export function qubitState(theta: number, phi: number): QubitState {
  const t = Math.max(0, Math.min(Math.PI, theta)),
    p = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    sin = Math.sin(t);
  return {
    theta: t,
    phi: p,
    x: sin * Math.cos(p),
    y: sin * Math.sin(p),
    z: Math.cos(t),
    alpha: { re: Math.cos(t / 2), im: 0 },
    beta: { re: Math.cos(p) * Math.sin(t / 2), im: Math.sin(p) * Math.sin(t / 2) },
  };
}
export function measurementProbability(s: QubitState, axis: MeasurementAxis): number {
  return (1 + (axis === 'x' ? s.x : axis === 'y' ? s.y : s.z)) / 2;
}
export const QUBIT_PRESETS = {
  zero: { label: '|0⟩', theta: 0, phi: 0 },
  one: { label: '|1⟩', theta: Math.PI, phi: 0 },
  plus: { label: '|+⟩', theta: Math.PI / 2, phi: 0 },
  minus: { label: '|−⟩', theta: Math.PI / 2, phi: Math.PI },
  plusI: { label: '|+i⟩', theta: Math.PI / 2, phi: Math.PI / 2 },
} as const;
export type QubitPreset = keyof typeof QUBIT_PRESETS;
