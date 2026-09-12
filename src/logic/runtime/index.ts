'use client';

export type {
  GateType,
  LogicInput,
  LogicGate,
  LogicOutput,
  LogicDoc,
  GateDef,
  LogicSolution,
  LogicDiagnostic,
} from '../contract.js';
export { registerGate, getGate, listGates } from '../registry.js';
export { registerBuiltinGates } from '../gates.js';
export { evaluate, truthTable } from '../evaluate.js';
export { LogicScene, type LogicSceneProps } from '../LogicScene.js';
export { LogicGateLab, type LogicGateProps } from '../lab.js';
export { BinaryDisplayLab, type BinaryDisplayProps } from '../display.js';
export { LOGIC_PRESETS, presetDoc, type LogicPresetKey } from '../presets.js';
export { netlistToDoc, type BooleanNetlist } from '../netlist.js';
export * from '../sequential.js';
export { SequentialLogicLab, type SequentialLogicLabProps } from '../SequentialLogicLab.js';
export {
  SEQUENTIAL_PRESETS,
  sequentialPreset,
  type SequentialPreset,
  type SequentialPresetKey,
} from '../sequential-presets.js';
