import { CircuitDoc, CircuitSolution } from "./contract.mjs";

//#region src/build/flow.d.ts
declare const pinKey: (id: string, pin: string) => string;
declare const nodeKey: (nid: string) => string;
interface WireFlow {
  /** signed current from pin/node `u` to pin/node `v` (amps); positive = u→v. */
  current: (u: string, v: string) => number;
}
/** Threshold below which a wire is treated as carrying no current (float-noise / open branch). */
declare const FLOW_EPS = 0.000001;
declare function wireCurrents(doc: CircuitDoc, sol: CircuitSolution): WireFlow;
//#endregion
export { FLOW_EPS, WireFlow, nodeKey, pinKey, wireCurrents };