/**
 * Evaluate a LogicDoc by SETTLING it: resolve every node's boolean value, compute the
 * propagation LEVELS (inputs at level 0, each gate one level past its deepest input), and
 * report anything structurally wrong.
 *
 * Feedback is legal. A network is evaluated by repeated passes until no value changes, so a
 * pair of cross-coupled NAND gates reaches a stable state and HOLDS it, which is what makes
 * a latch a latch. Only a network that never stops changing (a ring oscillator) is reported
 * as a cycle. An acyclic network settles in at most one pass per level and produces exactly
 * the values a single depth-first pass would, so nothing about combinational labs changes.
 *
 * Memory needs history, and one `evaluate` call has none: pass the previous solution's
 * `settled` map back in as `seed` and a latch remembers across evaluations. Without a seed
 * every node starts low, which is the usual power-up convention.
 */

import { getGate } from './registry.js';
import { registerBuiltinGates } from './gates.js';
import type { LogicDoc, LogicSolution } from './contract.js';

registerBuiltinGates(); // ensure built-in gates exist even if evaluate is used standalone

export interface EvaluateOptions {
  /** Previous settled values, so a feedback circuit carries its state forward. */
  seed?: Readonly<Record<string, boolean>>;
  /** Passes allowed before the network is declared unstable. Defaults to a bound generous
   *  enough for any settling network of this size. */
  maxPasses?: number;
}

export function evaluate(doc: LogicDoc, options: EvaluateOptions = {}): LogicSolution {
  const inputVal = new Map(doc.inputs.map((i) => [i.id, !!i.value]));
  const gateById = new Map(doc.gates.map((g) => [g.id, g]));
  const diagnostics: LogicSolution['diagnostics'] = [];
  const diagnosticKeys = new Set<string>();

  const report = (diagnostic: LogicSolution['diagnostics'][number]) => {
    const key = `${diagnostic.code}:${diagnostic.nodeId}:${diagnostic.path?.join('>') ?? ''}`;
    if (diagnosticKeys.has(key)) return;
    diagnosticKeys.add(key);
    diagnostics.push(diagnostic);
  };

  // ── structure ────────────────────────────────────────────────────────────────
  // Find feedback loops before evaluating. Their members get no propagation depth (a
  // latch has no "level"), and they are the paths named if the network fails to settle.
  const cyclic = new Set<string>();
  const cyclePaths: string[][] = [];
  {
    const visiting = new Set<string>();
    const done = new Set<string>();
    const stack: string[] = [];
    const walk = (id: string): void => {
      if (visiting.has(id)) {
        const path = [...stack.slice(Math.max(0, stack.indexOf(id))), id];
        for (const node of path) cyclic.add(node);
        cyclePaths.push(path);
        return;
      }
      if (done.has(id) || !gateById.has(id)) return;
      visiting.add(id);
      stack.push(id);
      for (const source of gateById.get(id)!.in) walk(source);
      stack.pop();
      visiting.delete(id);
      done.add(id);
    };
    for (const gate of doc.gates) walk(gate.id);
  }

  for (const gate of doc.gates) {
    if (!getGate(gate.kind))
      report({
        code: 'unknown-gate',
        nodeId: gate.id,
        message: `Unknown gate kind "${gate.kind}" at "${gate.id}".`,
      });
    for (const source of gate.in)
      if (!inputVal.has(source) && !gateById.has(source))
        report({ code: 'unknown-node', nodeId: source, message: `Unknown logic node "${source}".` });
  }

  // ── settle ───────────────────────────────────────────────────────────────────
  const state = new Map<string, boolean>();
  for (const gate of doc.gates) state.set(gate.id, !!options.seed?.[gate.id]);

  const read = (id: string): boolean => inputVal.get(id) ?? state.get(id) ?? false;

  const maxPasses = options.maxPasses ?? doc.gates.length * 2 + 8;
  let settledIn = 0;
  let stable = false;
  for (let pass = 0; pass < maxPasses && !stable; pass++) {
    stable = true;
    for (const gate of doc.gates) {
      const def = getGate(gate.kind);
      const next = def ? def.eval(gate.in.map(read)) : false;
      if (state.get(gate.id) !== next) {
        state.set(gate.id, next);
        stable = false;
      }
    }
    settledIn = pass + 1;
  }
  if (!stable)
    for (const path of cyclePaths)
      report({
        code: 'combinational-cycle',
        nodeId: path[0]!,
        path,
        message: `Feedback loop never settles (it oscillates): ${path.join(' -> ')}`,
      });

  const value = (id: string): boolean => {
    if (inputVal.has(id)) return inputVal.get(id)!;
    if (state.has(id)) return state.get(id)!;
    report({ code: 'unknown-node', nodeId: id, message: `Unknown logic node "${id}".` });
    return false;
  };

  // ── propagation depth (meaningful only off the feedback loops) ────────────────
  const depth = new Map<string, number>();
  for (const i of doc.inputs) depth.set(i.id, 0);
  const depthVisiting = new Set<string>();
  const findDepth = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (depthVisiting.has(id)) return 0;
    const gate = gateById.get(id);
    if (!gate) return 0;
    depthVisiting.add(id);
    const result = Math.max(0, ...gate.in.map(findDepth)) + 1;
    depthVisiting.delete(id);
    if (!cyclic.has(id)) depth.set(id, result);
    return result;
  };
  for (const gate of doc.gates) findDepth(gate.id);
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
    if (o.goal !== undefined) {
      goalCount++;
      if (outputs[o.id] !== o.goal) goalsMet = false;
    }
  }
  const allGoalsMet = goalCount > 0 && goalsMet;

  return {
    value,
    levels,
    depthOf: (id) => depth.get(id) ?? 0,
    high: value,
    outputs,
    allGoalsMet,
    diagnostics,
    valid: diagnostics.length === 0,
    settled: Object.fromEntries(state),
    stable,
    settledIn,
  };
}

/** A truth table is 2^n rows; past this it is both impractical to show and unsafe
 *  for 32-bit bit shifts. Callers should guard before rendering one. */
export const MAX_TRUTH_TABLE_VARS = 12;

/** The full truth table for a doc: every input combination → output values. */
export function truthTable(doc: LogicDoc): { inputs: boolean[]; outputs: Record<string, boolean> }[] {
  const n = doc.inputs.length;
  if (n > MAX_TRUTH_TABLE_VARS)
    throw new RangeError(
      `truthTable: ${n} inputs exceeds the ${MAX_TRUTH_TABLE_VARS}-variable limit (${2 ** n} rows).`,
    );
  const rows: { inputs: boolean[]; outputs: Record<string, boolean> }[] = [];
  for (let m = 0; m < 2 ** n; m++) {
    const bits = doc.inputs.map((_, k) => Boolean((m >> (n - 1 - k)) & 1));
    const probe: LogicDoc = { ...doc, inputs: doc.inputs.map((inp, k) => ({ ...inp, value: bits[k] })) };
    rows.push({ inputs: bits, outputs: evaluate(probe).outputs });
  }
  return rows;
}
