/**
 * Adapt an authored boolean NETLIST (input switches, typed gates, output LEDs) to the engine's
 * `LogicDoc`, so an authored logic-circuit lab evaluates + renders through the ONE digital-logic
 * engine (evaluate + LogicScene) instead of a duplicated evaluator/layout. The gate `type`
 * (AND/OR/NOT/…) is the engine's gate `kind`; `initial` seeds each switch's starting value.
 */
import type { GateType } from '../kit/logic-gates/gate.js';
import type { LogicDoc } from './contract.js';

export interface BooleanNetlist {
  inputs?: (string | { id: string; label?: string })[];
  gates?: { id: string; type: GateType; in: string[] }[];
  outputs?: { id: string; in: string; label?: string; color?: string; goal?: boolean }[];
  /** starting switch positions (default: all off). */
  initial?: Record<string, boolean>;
}

export function netlistToDoc(n: BooleanNetlist): LogicDoc {
  const initial = n.initial ?? {};
  return {
    inputs: (n.inputs ?? []).map((i) => {
      const o = typeof i === 'string' ? { id: i } : i;
      return { id: o.id, label: o.label, value: initial[o.id] ?? false };
    }),
    gates: (n.gates ?? []).map((g) => ({ id: g.id, kind: g.type, in: g.in })),
    outputs: (n.outputs ?? []).map((o) => ({
      id: o.id,
      in: o.in,
      label: o.label,
      color: o.color,
      goal: o.goal,
    })),
  };
}
