'use client';

export type { CircuitDoc } from '../contract.js';
export { CircuitEditor, type CircuitEditorProps } from '../CircuitEditor.js';
export {
  addPart,
  movePart,
  updateProps,
  rotatePart,
  deletePart,
  connect,
  addWire,
  removeWire,
  disconnectWire,
  retargetWire,
  spliceIntoWire,
  setGround,
  tapWire,
  addJunction,
  pruneJunctions,
  terminalOf,
  wirePolyline,
  setWireWaypoints,
} from '../editor-ops.js';
