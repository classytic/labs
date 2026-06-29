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
  GateType, LogicInput, LogicGate, LogicOutput, LogicDoc, GateDef, LogicSolution,
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
  addNode, moveNode, connect, disconnect, deleteNode, setInputValue, toggleInput, relabel, setGoal, type PortRef,
} from './edit-ops.js';
export { LOGIC_PRESETS, presetDoc, type LogicPresetKey } from './presets.js';
