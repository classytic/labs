// @classytic/labs/geography — interactive geography labs. The flagship is the
// GENERAL cycle engine: one CycleLab authors any labelled directed cycle (water,
// rock, carbon, nitrogen, food chains…) on the shared CycleDiagram renderer.
// Built on @classytic/stage; tokenized, authorable, agent-drivable.
export { CycleLab, type CycleLabProps, type CycleChallenge } from './cycle-lab/index.js';
export { CycleDiagram, edgeKey, type CycleNode, type CycleEdge } from '../kit/cycle.js';
export { WATER_CYCLE, ROCK_CYCLE, CARBON_CYCLE, CYCLE_PRESETS, type CycleSpec, type CyclePresetKey } from './cycles.js';
