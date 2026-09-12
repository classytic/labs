import { solveDC, type Elem } from '@classytic/stage/circuit';

const K = 0.5;

export const inverterElements = (input: number, vdd: number, vth: number): Elem[] => [
  { kind: 'V', n1: 1, n2: 0, value: vdd },
  { kind: 'V', n1: 3, n2: 0, value: input },
  { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k: K },
  { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },
];

export const rnmosNotElements = (input: number, vdd: number, vth: number, rpull: number): Elem[] => [
  { kind: 'V', n1: 1, n2: 0, value: vdd },
  { kind: 'V', n1: 3, n2: 0, value: input },
  { kind: 'R', n1: 1, n2: 2, value: rpull },
  { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },
];

export const nandElements = (a: number, b: number, vdd: number, vth: number): Elem[] => [
  { kind: 'V', n1: 1, n2: 0, value: vdd },
  { kind: 'V', n1: 3, n2: 0, value: a },
  { kind: 'V', n1: 4, n2: 0, value: b },
  { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k: K },
  { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 4, value: 0, vth, k: K },
  { kind: 'M', n1: 2, n2: 5, n3: 3, value: 0, vth, k: K },
  { kind: 'M', n1: 5, n2: 0, n3: 4, value: 0, vth, k: K },
];

export const norElements = (a: number, b: number, vdd: number, vth: number): Elem[] => [
  { kind: 'V', n1: 1, n2: 0, value: vdd },
  { kind: 'V', n1: 3, n2: 0, value: a },
  { kind: 'V', n1: 4, n2: 0, value: b },
  { kind: 'M', pmos: true, n1: 5, n2: 1, n3: 3, value: 0, vth, k: K },
  { kind: 'M', pmos: true, n1: 2, n2: 5, n3: 4, value: 0, vth, k: K },
  { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },
  { kind: 'M', n1: 2, n2: 0, n3: 4, value: 0, vth, k: K },
];

export const solveOutput = (elements: Elem[]): number => solveDC(elements).nodeV[2] ?? 0;
