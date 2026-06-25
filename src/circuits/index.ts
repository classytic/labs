// @classytic/labs/circuits — interactive electronics labs.

// ── On the @classytic/stage engine ──────────────────────────────────────────
export { circuitDoc, CircuitNetworkLab, CIRCUIT_NETWORK_ASSET, type CircuitNetworkProps, type CircuitComponentSpec, type CircuitGoal } from './circuit/index.js';
// SVG <Stage> schematics (VDR/CDR walkthrough + a buildable flashlight loop):
export { CircuitLab, type CircuitLabProps } from './circuit-lab.js';
export { CircuitBuilder, type CircuitBuilderProps, type CircuitComponent } from './circuit-builder.js';
// RC charge/leak (time-dependent — useFrameLoop integrator, tokenized glyphs):
export { CapacitorLeakLab, type CapacitorLeakProps } from './capacitor-leak/index.js';
// AC vs DC — one WaveCore sim → glowing lamp + flowing electrons + water analogy + live scope:
export { AcDcLab, type AcDcProps } from './ac-dc/index.js';

// ── circuits/ is fully migrated to @classytic/stage (SVG). No canvas legacy. ──
