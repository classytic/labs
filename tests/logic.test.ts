/**
 * Digital-logic engine: a LogicDoc → evaluate → values + propagation levels.
 * Proves the data-driven gate engine matches boolean algebra, including a half-adder.
 */

import { describe, it, expect } from 'vitest';
import { evaluate, truthTable, getGate, listGates, presetDoc, LOGIC_PRESETS, addNode, connect, moveNode, deleteNode, disconnect } from '../src/logic/index.js';
import { digitSegments } from '../src/kit/logic-gates.js';
import type { LogicDoc } from '../src/logic/index.js';

const EMPTY: LogicDoc = { inputs: [], gates: [], outputs: [] };

describe('gate registry', () => {
  it('registers the built-in gates', () => {
    expect(listGates().map((g) => g.kind).sort()).toEqual(['AND', 'NAND', 'NOR', 'NOT', 'OR', 'XNOR', 'XOR', 'buffer']);
  });
  it('each gate evaluates its boolean function', () => {
    expect(getGate('AND')!.eval([true, true])).toBe(true);
    expect(getGate('AND')!.eval([true, false])).toBe(false);
    expect(getGate('NAND')!.eval([true, true])).toBe(false);
    expect(getGate('XOR')!.eval([true, false])).toBe(true);
    expect(getGate('NOT')!.eval([true])).toBe(false);
  });
});

describe('evaluate a gate network', () => {
  const doc: LogicDoc = {
    inputs: [{ id: 'a', label: 'A', value: true }, { id: 'b', label: 'B', value: false }],
    gates: [
      { id: 'g1', kind: 'AND', in: ['a', 'b'] },
      { id: 'g2', kind: 'OR', in: ['a', 'b'] },
      { id: 'g3', kind: 'XOR', in: ['g1', 'g2'] }, // depth 2
    ],
    outputs: [{ id: 'y', in: 'g3', label: 'Y' }],
  };

  it('resolves values through the network', () => {
    const sol = evaluate(doc);
    expect(sol.value('g1')).toBe(false); // A·B = 1·0
    expect(sol.value('g2')).toBe(true); // A+B
    expect(sol.value('g3')).toBe(true); // 0 XOR 1
    expect(sol.outputs.y).toBe(true);
  });

  it('computes propagation levels (inputs at 0, gates by depth)', () => {
    const sol = evaluate(doc);
    expect(sol.levels[0].sort()).toEqual(['a', 'b']);
    expect(sol.levels[1].sort()).toEqual(['g1', 'g2']);
    expect(sol.levels[2]).toEqual(['g3']);
    expect(sol.depthOf('g3')).toBe(2);
  });

  it('handles a combinational cycle without hanging', () => {
    const cyclic: LogicDoc = { inputs: [], gates: [{ id: 'g', kind: 'NOT', in: ['g'] }], outputs: [{ id: 'o', in: 'g' }] };
    expect(() => evaluate(cyclic)).not.toThrow();
  });
});

describe('NAND universality + half-adder', () => {
  it('a NOT built from a NAND inverts', () => {
    const doc: LogicDoc = { inputs: [{ id: 'a', value: true }], gates: [{ id: 'n', kind: 'NAND', in: ['a', 'a'] }], outputs: [{ id: 'o', in: 'n' }] };
    expect(evaluate(doc).outputs.o).toBe(false);
  });

  it('a half-adder gives SUM = A XOR B and CARRY = A AND B', () => {
    const ha: LogicDoc = {
      inputs: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      gates: [{ id: 'sum', kind: 'XOR', in: ['a', 'b'] }, { id: 'carry', kind: 'AND', in: ['a', 'b'] }],
      outputs: [{ id: 'S', in: 'sum', label: 'Sum' }, { id: 'C', in: 'carry', label: 'Carry' }],
    };
    const rows = truthTable(ha);
    // A,B → Sum,Carry : 00→0,0  01→1,0  10→1,0  11→0,1
    expect(rows.map((r) => [r.outputs.S, r.outputs.C])).toEqual([[false, false], [true, false], [true, false], [false, true]]);
  });

  it('marks goals met when outputs match', () => {
    const doc: LogicDoc = { inputs: [{ id: 'a', value: true }, { id: 'b', value: true }], gates: [{ id: 'g', kind: 'AND', in: ['a', 'b'] }], outputs: [{ id: 'y', in: 'g', goal: true }] };
    expect(evaluate(doc).allGoalsMet).toBe(true);
  });
});

describe('preset library', () => {
  it('every preset deep-clones to an evaluable doc', () => {
    for (const key of Object.keys(LOGIC_PRESETS)) {
      const doc = presetDoc(key);
      expect(doc.outputs.length).toBeGreaterThan(0);
      expect(() => evaluate(doc)).not.toThrow();
    }
  });
  it('NAND-built AND matches a real AND across the table', () => {
    expect(truthTable(presetDoc('nand-and')).map((r) => Object.values(r.outputs)[0]))
      .toEqual([false, false, false, true]);
  });
  it('full adder sums A + B + Cin', () => {
    // each row: Sum + 2*Cout should equal popcount of inputs
    for (const r of truthTable(presetDoc('full-adder'))) {
      const ones = r.inputs.filter(Boolean).length;
      expect((r.outputs.S ? 1 : 0) + (r.outputs.C ? 2 : 0)).toBe(ones);
    }
  });
});

describe('builder edit-ops', () => {
  it('builds and wires an AND circuit, then evaluates it live', () => {
    let d = EMPTY;
    const a = addNode(d, 'input', { x: 0, y: 0 }); d = a.doc;
    const b = addNode(d, 'input', { x: 0, y: 60 }); d = b.doc;
    const g = addNode(d, 'AND', { x: 200, y: 0 }); d = g.doc;
    const y = addNode(d, 'output', { x: 400, y: 0 }); d = y.doc;
    d = connect(d, a.id, { nodeId: g.id, slot: 0 });
    d = connect(d, b.id, { nodeId: g.id, slot: 1 });
    d = connect(d, g.id, { nodeId: y.id });
    // both inputs default low → AND is 0
    expect(evaluate(d).outputs[y.id]).toBe(false);
    // drive both high → AND is 1
    d = { ...d, inputs: d.inputs.map((i) => ({ ...i, value: true })) };
    expect(evaluate(d).outputs[y.id]).toBe(true);
  });

  it('moveNode repositions without touching wiring', () => {
    const a = addNode(EMPTY, 'AND', { x: 10, y: 10 });
    const moved = moveNode(a.doc, a.id, { x: 99, y: 88 });
    expect(moved.gates[0]).toMatchObject({ id: a.id, x: 99, y: 88, kind: 'AND' });
  });

  it('deleteNode removes the node and clears references to it', () => {
    let d = EMPTY;
    const a = addNode(d, 'input', { x: 0, y: 0 }); d = a.doc;
    const g = addNode(d, 'NOT', { x: 100, y: 0 }); d = g.doc;
    d = connect(d, a.id, { nodeId: g.id, slot: 0 });
    expect(d.gates[0]!.in[0]).toBe(a.id);
    d = deleteNode(d, a.id);
    expect(d.inputs).toHaveLength(0);
    expect(d.gates[0]!.in[0]).toBe(''); // reference cleared
  });

  it('disconnect clears a single input slot; self-wiring is rejected', () => {
    let d = addNode(EMPTY, 'AND', { x: 0, y: 0 }).doc;
    const g = d.gates[0]!;
    d = connect(d, g.id, { nodeId: g.id, slot: 0 }); // a gate cannot feed itself
    expect(d.gates[0]!.in[0]).toBe('');
    const i = addNode(d, 'input', { x: 0, y: 0 }); d = i.doc;
    d = connect(d, i.id, { nodeId: g.id, slot: 1 });
    expect(d.gates[0]!.in[1]).toBe(i.id);
    d = disconnect(d, { nodeId: g.id, slot: 1 });
    expect(d.gates[0]!.in[1]).toBe('');
  });
});

describe('seven-segment decoder', () => {
  it('lights the right segments for 0, 1, and 8', () => {
    expect(digitSegments(0)).toEqual([true, true, true, true, true, true, false]); // all but g
    expect(digitSegments(1)).toEqual([false, true, true, false, false, false, false]); // b,c
    expect(digitSegments(8)).toEqual([true, true, true, true, true, true, true]); // all on
  });
  it('wraps the value into 0–F', () => {
    expect(digitSegments(16)).toEqual(digitSegments(0));
    expect(digitSegments(-1)).toEqual(digitSegments(15));
  });
});
