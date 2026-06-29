import { LogicDoc, LogicSolution } from "./contract.mjs";

//#region src/logic/evaluate.d.ts
declare function evaluate(doc: LogicDoc): LogicSolution;
/** The full truth table for a doc: every input combination → output values. */
declare function truthTable(doc: LogicDoc): {
  inputs: boolean[];
  outputs: Record<string, boolean>;
}[];
//#endregion
export { evaluate, truthTable };