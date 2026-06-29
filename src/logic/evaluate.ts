/**
 * Evaluate a LogicDoc in one pass: resolve every node's boolean value (memoised, with a
 * cycle guard) and compute the propagation LEVELS (inputs at level 0, each gate one level
 * past its deepest input). The levels let a lesson light the signal up step by step, and
 * `high(nodeId)` tells the renderer which wires are carrying a 1.
 */

import { getGate } from './registry.js';
import { registerBuiltinGates } from './gates.js';
import type { LogicDoc, LogicSolution } from './contract.js';

registerBuiltinGates(); // ensure built-in gates exist even if evaluate is used standalone

export function evaluate(doc: LogicDoc): LogicSolution {
  const inputVal = new Map(doc.inputs.map((i) => [i.id, !!i.value]));
  const gateById = new Map(doc.gates.map((g) => [g.id, g]));
  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();

  const value = (id: string): boolean => {
    if (inputVal.has(id)) return inputVal.get(id)!;
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return false; // break combinational cycles
    const g = gateById.get(id);
    if (!g) return false;
    visiting.add(id);
    const def = getGate(g.kind);
    const out = def ? def.eval(g.in.map(value)) : false;
    visiting.delete(id);
    memo.set(id, out);
    return out;
  };
  for (const g of doc.gates) value(g.id);

  // propagation depth: inputs = 0; a gate = 1 + the deepest input it depends on
  const depth = new Map<string, number>();
  for (const i of doc.inputs) depth.set(i.id, 0);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < doc.gates.length + 2) {
    changed = false;
    for (const g of doc.gates) {
      const d = Math.max(0, ...g.in.map((x) => depth.get(x) ?? 0)) + 1;
      if (depth.get(g.id) !== d) { depth.set(g.id, d); changed = true; }
    }
  }
  const maxD = Math.max(0, ...depth.values());
  const levels: string[][] = Array.from({ length: maxD + 1 }, () => []);
  for (const [id, d] of depth) (levels[d] ??= []).push(id);

  const outputs: Record<string, boolean> = {};
  // "all goals met" requires at least ONE output to actually declare a goal —
  // a doc with outputs but no `goal` values is not "solved", it's ungraded.
  let goalCount = 0;
  let goalsMet = true;
  for (const o of doc.outputs) {
    outputs[o.id] = value(o.in);
    if (o.goal !== undefined) { goalCount++; if (outputs[o.id] !== o.goal) goalsMet = false; }
  }
  const allGoalsMet = goalCount > 0 && goalsMet;

  return {
    value,
    levels,
    depthOf: (id) => depth.get(id) ?? 0,
    high: value,
    outputs,
    allGoalsMet,
  };
}

/** A truth table is 2^n rows; past this it is both impractical to show and unsafe
 *  for 32-bit bit shifts. Callers should guard before rendering one. */
export const MAX_TRUTH_TABLE_VARS = 12;

/** The full truth table for a doc: every input combination → output values. */
export function truthTable(doc: LogicDoc): { inputs: boolean[]; outputs: Record<string, boolean> }[] {
  const n = doc.inputs.length;
  if (n > MAX_TRUTH_TABLE_VARS) throw new RangeError(`truthTable: ${n} inputs exceeds the ${MAX_TRUTH_TABLE_VARS}-variable limit (${2 ** n} rows).`);
  const rows: { inputs: boolean[]; outputs: Record<string, boolean> }[] = [];
  for (let m = 0; m < 2 ** n; m++) {
    const bits = doc.inputs.map((_, k) => Boolean((m >> (n - 1 - k)) & 1));
    const probe: LogicDoc = { ...doc, inputs: doc.inputs.map((inp, k) => ({ ...inp, value: bits[k] })) };
    rows.push({ inputs: bits, outputs: evaluate(probe).outputs });
  }
  return rows;
}
