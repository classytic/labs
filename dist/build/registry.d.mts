import { PartDef, PartKind } from "./contract.mjs";

//#region src/build/registry.d.ts
declare function registerPart(def: PartDef): void;
declare function getPart(kind: PartKind): PartDef | undefined;
/** Every registered part (drives the builder palette). */
declare function listParts(): PartDef[];
//#endregion
export { getPart, listParts, registerPart };