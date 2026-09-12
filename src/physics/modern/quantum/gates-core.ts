import { qubitState, type QubitState } from './qubit-core.js';
export type QuantumGate = 'x' | 'z' | 'h' | 's';
type C = { re: number; im: number };
export interface GateState {
  alpha: C;
  beta: C;
  bloch: QubitState;
}
const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im }),
  sub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im }),
  mulI = (a: C): C => ({ re: -a.im, im: a.re });
export function amplitudesToState(alpha: C, beta: C): GateState {
  const theta = 2 * Math.atan2(Math.hypot(beta.re, beta.im), Math.hypot(alpha.re, alpha.im)),
    phi = Math.atan2(beta.im, beta.re) - Math.atan2(alpha.im, alpha.re);
  return { alpha, beta, bloch: qubitState(theta, phi) };
}
export const initialGateState = (): GateState => amplitudesToState({ re: 1, im: 0 }, { re: 0, im: 0 });
export function applyQuantumGate(s: GateState, gate: QuantumGate): GateState {
  const q = Math.SQRT1_2;
  switch (gate) {
    case 'x':
      return amplitudesToState(s.beta, s.alpha);
    case 'z':
      return amplitudesToState(s.alpha, { re: -s.beta.re, im: -s.beta.im });
    case 'h':
      return amplitudesToState(
        { re: add(s.alpha, s.beta).re * q, im: add(s.alpha, s.beta).im * q },
        { re: sub(s.alpha, s.beta).re * q, im: sub(s.alpha, s.beta).im * q },
      );
    case 's':
      return amplitudesToState(s.alpha, mulI(s.beta));
  }
}
export function runGateSequence(gates: QuantumGate[]): GateState {
  return gates.reduce(applyQuantumGate, initialGateState());
}
