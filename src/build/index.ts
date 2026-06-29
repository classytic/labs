/**
 * @classytic/labs/build — the circuit builder.
 *
 * A circuit is a `CircuitDoc` (placed parts + nodes). `CircuitScene` renders it,
 * `solveCircuit` runs it through the MNA engine, and a component is added by
 * registering ONE `PartDef`. Built-in parts (cell/resistor/bulb/switch/diode/
 * capacitor/nmos/pmos) register on import. Phase 1 is read-only declarative; the
 * drag-drop editor is a later phase built on the same contract.
 */

export type {
  PartKind, PartInstance, CNode, PinRef, Wire, CircuitDoc, CircuitSolution, PartState, PartDef,
} from './contract.js';
export { registerPart, getPart, listParts } from './registry.js';
export { solveCircuit, partState } from './solve.js';
export { wireCurrents, pinKey, nodeKey, FLOW_EPS, type WireFlow } from './flow.js';
export { registerBuiltinParts } from './parts.js';
export { CircuitScene, type CircuitSceneProps, type CircuitEditorBag } from './CircuitScene.js';
export { CircuitPlayer, type CircuitPlayerProps } from './CircuitPlayer.js';
export { CircuitEditor, type CircuitEditorProps } from './CircuitEditor.js';
export { addPart, movePart, updateProps, rotatePart, deletePart, connect, addWire, removeWire, disconnectWire, retargetWire, spliceIntoWire, setGround, tapWire, addJunction, pruneJunctions, terminalOf, wirePolyline, setWireWaypoints } from './editor-ops.js';
