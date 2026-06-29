import { GateType } from "../../kit/logic-gates.mjs";
import { ReactNode } from "react";

//#region src/discrete/logic-circuit/preset.d.ts
interface CircuitInput {
  id: string;
  label?: string;
}
interface CircuitGate {
  id: string;
  type: GateType;
  in: string[];
}
interface CircuitOutput {
  id: string;
  in: string;
  label?: string;
  color?: string;
  goal?: boolean;
}
interface BooleanCircuitProps {
  inputs: (CircuitInput | string)[];
  gates: CircuitGate[];
  outputs: CircuitOutput[];
  /** Seed switch positions (e.g. present the circuit already energised). Default: all off. */
  initial?: Record<string, boolean>;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function BooleanCircuitLab({
  inputs: inputs0,
  gates,
  outputs,
  initial,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: BooleanCircuitProps): ReactNode;
//#endregion
export { BooleanCircuitLab, BooleanCircuitProps, CircuitGate, CircuitInput, CircuitOutput };