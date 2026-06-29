import { CycleEdge, CycleNode } from "../kit/cycle.mjs";

//#region src/geography/cycles.d.ts
interface CycleSpec {
  nodes: CycleNode[];
  edges: CycleEdge[];
}
/** Water cycle, a clean 5-stage ring; each edge is one distinct process. */
declare const WATER_CYCLE: CycleSpec;
/** Rock cycle, a ring PLUS shortcuts: any rock can skip ahead (heat, re-weather). */
declare const ROCK_CYCLE: CycleSpec;
/** Carbon cycle, branched (CO₂ in/out by several routes); ties to photo/respiration. */
declare const CARBON_CYCLE: CycleSpec;
declare const CYCLE_PRESETS: {
  readonly water: CycleSpec;
  readonly rock: CycleSpec;
  readonly carbon: CycleSpec;
};
type CyclePresetKey = keyof typeof CYCLE_PRESETS;
//#endregion
export { CARBON_CYCLE, CYCLE_PRESETS, CyclePresetKey, CycleSpec, ROCK_CYCLE, WATER_CYCLE };