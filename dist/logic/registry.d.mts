import { GateDef } from "./contract.mjs";

//#region src/logic/registry.d.ts
declare function registerGate(def: GateDef): void;
declare function getGate(kind: string): GateDef | undefined;
/** Every registered gate (drives a builder palette). */
declare function listGates(): GateDef[];
//#endregion
export { getGate, listGates, registerGate };