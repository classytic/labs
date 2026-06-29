// @classytic/labs/circuits, interactive electronics labs.

// ── On the @classytic/stage engine ──────────────────────────────────────────
export { circuitDoc, CircuitNetworkLab, CIRCUIT_NETWORK_ASSET, type CircuitNetworkProps, type CircuitComponentSpec, type CircuitGoal } from './circuit/index.js';
// SVG <Stage> schematics (VDR/CDR walkthrough + a buildable flashlight loop):
export { CircuitLab, type CircuitLabProps } from './circuit-lab.js';
export { CircuitBuilder, type CircuitBuilderProps, type CircuitComponent } from './circuit-builder.js';
// RC charge/leak (time-dependent, useFrameLoop integrator, tokenized glyphs):
export { CapacitorLeakLab, type CapacitorLeakProps } from './capacitor-leak/index.js';
// AC vs DC, one WaveCore sim → glowing lamp + flowing electrons + water analogy + live scope:
export { AcDcLab, type AcDcProps } from './ac-dc/index.js';

export { RCChargingLab, type RCChargingProps } from './rc-charging/index.js';
export { DiodeLab, type DiodeProps } from './diode/index.js';
export { TransistorLab, type TransistorProps } from './transistor/index.js';
export { CmosInverterLab, type CmosInverterProps, RNmosNotLab, type RNmosNotProps, CmosNandLab, type CmosNandProps, CmosNorLab, type CmosNorProps } from './cmos-gate/index.js';
// Power integrity: a falling supply rail (EMF / brown-out) breaks the logic:
export { BrownoutLab, type BrownoutProps } from './brownout/index.js';
// Inside the device: NMOS channel formation + PN junction, carriers (electrons/holes) moving:
export { MosfetInsideLab, type MosfetInsideProps, PnJunctionLab, type PnJunctionProps, BjtInsideLab, type BjtInsideProps, SiliconLatticeLab, type SiliconLatticeProps, ConductionLab, type ConductionProps, HallEffectLab, type HallProps } from './semiconductor/index.js';

// ── circuits/ is fully migrated to @classytic/stage (SVG). No canvas legacy. ──
