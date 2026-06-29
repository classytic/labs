import { GateType } from "../kit/logic-gates.mjs";

//#region src/logic/contract.d.ts
/** A primary input (a switch the learner can toggle). */
interface LogicInput {
  id: string;
  label?: string;
  /** starting level (default low). */
  value?: boolean;
  /** free-placement position (builder canvas); omitted = auto-layout by LogicScene. */
  x?: number;
  y?: number;
}
/** A gate node: `kind` selects the GateDef, `in` lists the node ids feeding its inputs. */
interface LogicGate {
  id: string;
  kind: string;
  in: string[];
  label?: string;
  x?: number;
  y?: number;
}
/** A circuit output (an LED). `in` is the node id driving it. `goal` is the expected value. */
interface LogicOutput {
  id: string;
  in: string;
  label?: string;
  goal?: boolean;
  /** LED colour token (default the live colour). */
  color?: string;
  x?: number;
  y?: number;
}
/** The serializable logic circuit. */
interface LogicDoc {
  inputs: LogicInput[];
  gates: LogicGate[];
  outputs: LogicOutput[];
  /** builder canvas size (free-placement editor). */
  size?: {
    w: number;
    h: number;
  };
}
/** The one extension point: register a gate kind once to make it evaluable + drawable. */
interface GateDef {
  kind: string;
  label: string;
  /** glyph shape drawn by GateGlyph. */
  glyph: GateType;
  /** number of inputs (1 for NOT/buffer, 2 default; n-input gates evaluate variadically). */
  arity: number;
  /** pure boolean function of the resolved input values. */
  eval: (inputs: boolean[]) => boolean;
}
interface LogicSolution {
  /** value at any node id (input or gate); false for unknown / cycles. */
  value: (nodeId: string) => boolean;
  /** propagation order: levels[0] = inputs, levels[k] = gates resolved at depth k. Drives
   *  step-by-step "the signal flows through" reveals. */
  levels: string[][];
  /** the depth (level index) a node settles at. */
  depthOf: (nodeId: string) => number;
  /** is the wire leaving `nodeId` carrying a HIGH (for the propagation glow). */
  high: (nodeId: string) => boolean;
  /** resolved output values by output id. */
  outputs: Record<string, boolean>;
  /** every output matches its `goal` (a solved challenge). */
  allGoalsMet: boolean;
}
//#endregion
export { GateDef, LogicDoc, LogicGate, LogicInput, LogicOutput, LogicSolution };