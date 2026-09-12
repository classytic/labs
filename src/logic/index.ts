/**
 * @classytic/labs/logic — the digital-logic engine.
 *
 * A logic circuit is a `LogicDoc` (inputs + gates + outputs). `evaluate` solves it in one
 * boolean pass with propagation levels (for step-by-step "the signal flows through"
 * reveals), `LogicScene` renders it with live wires showing which signal is HIGH, and a
 * gate is added by registering ONE `GateDef`. Built-in gates (AND/OR/NOT/NAND/NOR/XOR/
 * XNOR/buffer) register on import.
 */

export type {
  GateType,
  LogicInput,
  LogicGate,
  LogicOutput,
  LogicDoc,
  GateDef,
  LogicSolution,
  LogicDiagnostic,
} from './contract.js';
export { registerGate, getGate, listGates } from './registry.js';
export { registerBuiltinGates } from './gates.js';
export { evaluate, truthTable } from './evaluate.js';
export { LogicScene, type LogicSceneProps } from './LogicScene.js';
export { LogicGateLab, type LogicGateProps } from './lab.js';
export { BinaryDisplayLab, type BinaryDisplayProps } from './display.js';
export { LogicEditor, type LogicEditorProps } from './LogicEditor.js';
export { LogicEditScene, type LogicEditSceneProps } from './LogicEditScene.js';
export { LogicBuildLab, type LogicBuildProps } from './LogicBuildLab.js';
export {
  addNode,
  moveNode,
  connect,
  disconnect,
  deleteNode,
  setInputValue,
  toggleInput,
  relabel,
  setGoal,
  type PortRef,
} from './edit-ops.js';
export { LOGIC_PRESETS, presetDoc, type LogicPresetKey } from './presets.js';
export { netlistToDoc, type BooleanNetlist } from './netlist.js';
export * from './sequential.js';
// The SR latch as two cross-coupled gates, simulated per gate delay (the engine's `sr-latch` cell
// is the same behaviour as a box), and D latch against flip-flop timing on the engine.
export * from './latch.js';
export * from './timing.js';
export * from './counter.js';
export * from './detector.js';
export * from './shift.js';
export * as twos from './twos.js';
export * as ic from './ic.js';
export { ChipScene, type ChipSceneProps } from './ChipScene.js';
export { TwosScene, type TwosSceneProps, type TwosOperation } from './TwosScene.js';
export { ShiftScene, type ShiftSceneProps } from './ShiftScene.js';
export { DetectorScene, type DetectorSceneProps } from './DetectorScene.js';
export { LatchScene, type LatchSceneProps } from './LatchScene.js';
export { TimingScene, type TimingSceneProps } from './TimingScene.js';
export { CounterScene, type CounterSceneProps } from './CounterScene.js';
export { WaveScene, type WaveSceneProps, type WaveRow, type WaveMark } from './WaveScene.js';
export { SequentialLogicLab, type SequentialLogicLabProps } from './SequentialLogicLab.js';
export {
  SEQUENTIAL_PRESETS,
  sequentialPreset,
  type SequentialPreset,
  type SequentialPresetKey,
} from './sequential-presets.js';
