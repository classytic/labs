/**
 * A small library of named LogicDocs — the building blocks for gate lessons. They run the
 * "build complex logic from simple gates" story: basic gates, the NAND-universality set
 * (every gate from NANDs), and the half/full adders. A lab or lesson picks one by name.
 */

import type { LogicDoc } from './contract.js';

const inp = (id: string, label: string, value = false): LogicDoc['inputs'][number] => ({ id, label, value });

export const LOGIC_PRESETS: Record<string, { title: string; doc: LogicDoc }> = {
  and: {
    title: 'AND gate',
    doc: { inputs: [inp('a', 'A', true), inp('b', 'B', true)], gates: [{ id: 'g', kind: 'AND', in: ['a', 'b'] }], outputs: [{ id: 'y', in: 'g', label: 'Y' }] },
  },
  or: {
    title: 'OR gate',
    doc: { inputs: [inp('a', 'A', true), inp('b', 'B')], gates: [{ id: 'g', kind: 'OR', in: ['a', 'b'] }], outputs: [{ id: 'y', in: 'g', label: 'Y' }] },
  },
  xor: {
    title: 'XOR gate (differ?)',
    doc: { inputs: [inp('a', 'A', true), inp('b', 'B')], gates: [{ id: 'g', kind: 'XOR', in: ['a', 'b'] }], outputs: [{ id: 'y', in: 'g', label: 'Y' }] },
  },
  'nand-not': {
    title: 'NOT from a NAND',
    doc: { inputs: [inp('a', 'A', true)], gates: [{ id: 'g', kind: 'NAND', in: ['a', 'a'], label: 'NAND' }], outputs: [{ id: 'y', in: 'g', label: 'NOT A' }] },
  },
  'nand-and': {
    title: 'AND from two NANDs',
    doc: {
      inputs: [inp('a', 'A', true), inp('b', 'B', true)],
      gates: [{ id: 'g1', kind: 'NAND', in: ['a', 'b'] }, { id: 'g2', kind: 'NAND', in: ['g1', 'g1'] }],
      outputs: [{ id: 'y', in: 'g2', label: 'A·B' }],
    },
  },
  'nand-or': {
    title: 'OR from three NANDs',
    doc: {
      inputs: [inp('a', 'A', true), inp('b', 'B')],
      gates: [{ id: 'na', kind: 'NAND', in: ['a', 'a'] }, { id: 'nb', kind: 'NAND', in: ['b', 'b'] }, { id: 'g', kind: 'NAND', in: ['na', 'nb'] }],
      outputs: [{ id: 'y', in: 'g', label: 'A+B' }],
    },
  },
  'xor-nand': {
    title: 'XOR from four NANDs',
    doc: {
      inputs: [inp('a', 'A', true), inp('b', 'B')],
      gates: [
        { id: 'n1', kind: 'NAND', in: ['a', 'b'] },
        { id: 'n2', kind: 'NAND', in: ['a', 'n1'] },
        { id: 'n3', kind: 'NAND', in: ['b', 'n1'] },
        { id: 'g', kind: 'NAND', in: ['n2', 'n3'] },
      ],
      outputs: [{ id: 'y', in: 'g', label: 'A⊕B' }],
    },
  },
  'half-adder': {
    title: 'Half adder (1 + 1 = 10)',
    doc: {
      inputs: [inp('a', 'A', true), inp('b', 'B', true)],
      gates: [{ id: 'sum', kind: 'XOR', in: ['a', 'b'] }, { id: 'carry', kind: 'AND', in: ['a', 'b'] }],
      outputs: [{ id: 'S', in: 'sum', label: 'Sum' }, { id: 'C', in: 'carry', label: 'Carry', color: 'var(--stage-warn)' }],
    },
  },
  'full-adder': {
    title: 'Full adder (A + B + Cin)',
    doc: {
      inputs: [inp('a', 'A', true), inp('b', 'B', true), inp('cin', 'Cin')],
      gates: [
        { id: 'x1', kind: 'XOR', in: ['a', 'b'] },
        { id: 'sum', kind: 'XOR', in: ['x1', 'cin'] },
        { id: 'a1', kind: 'AND', in: ['x1', 'cin'] },
        { id: 'a2', kind: 'AND', in: ['a', 'b'] },
        { id: 'cout', kind: 'OR', in: ['a1', 'a2'] },
      ],
      outputs: [{ id: 'S', in: 'sum', label: 'Sum' }, { id: 'C', in: 'cout', label: 'Cout', color: 'var(--stage-warn)' }],
    },
  },
};

export type LogicPresetKey = keyof typeof LOGIC_PRESETS;

/** Deep-clone a preset doc so the lab can mutate input values without touching the library. */
export function presetDoc(key: string): LogicDoc {
  const p = (LOGIC_PRESETS[key] ?? LOGIC_PRESETS.and)!;
  return {
    inputs: p.doc.inputs.map((i) => ({ ...i })),
    gates: p.doc.gates.map((g) => ({ ...g, in: [...g.in] })),
    outputs: p.doc.outputs.map((o) => ({ ...o })),
  };
}
