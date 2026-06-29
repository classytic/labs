import { CircuitDoc, CircuitSolution, PartInstance, PartState } from "./contract.mjs";

//#region src/build/solve.d.ts
declare function solveCircuit(doc: CircuitDoc): CircuitSolution;
/** Derive the drawing state (current/voltage/live) for one part from the solution. */
declare function partState(part: PartInstance, sol: CircuitSolution): PartState;
//#endregion
export { partState, solveCircuit };