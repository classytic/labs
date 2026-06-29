import { LogicDoc } from "./contract.mjs";

//#region src/logic/edit-ops.d.ts
/** A point on a node where a wire attaches. `dir:'out'` is a source; `dir:'in'` is a sink. */
interface PortRef {
  nodeId: string;
  dir: 'out' | 'in';
  /** which input slot, for a multi-input gate sink. */
  slot?: number;
}
/** Add an input / output / gate (kind = 'input' | 'output' | a registered gate kind). */
declare function addNode(doc: LogicDoc, kind: string, at: {
  x: number;
  y: number;
}): {
  doc: LogicDoc;
  id: string;
};
/** Move any node to a new position. */
declare function moveNode(doc: LogicDoc, id: string, at: {
  x: number;
  y: number;
}): LogicDoc;
/** Wire a source node into a sink (a gate input slot, or an output). No-op for invalid pairs. */
declare function connect(doc: LogicDoc, fromId: string, sink: {
  nodeId: string;
  slot?: number;
}): LogicDoc;
/** Clear the wire feeding a sink slot. */
declare function disconnect(doc: LogicDoc, sink: {
  nodeId: string;
  slot?: number;
}): LogicDoc;
/** Delete a node and clear every reference to it. */
declare function deleteNode(doc: LogicDoc, id: string): LogicDoc;
/** Toggle / set a primary input's value. */
declare function setInputValue(doc: LogicDoc, id: string, value: boolean): LogicDoc;
declare function toggleInput(doc: LogicDoc, id: string): LogicDoc;
/** Rename a node's label (any node type). */
declare function relabel(doc: LogicDoc, id: string, label: string): LogicDoc;
/** Set / clear an output's goal value (for graded build challenges). */
declare function setGoal(doc: LogicDoc, outId: string, goal: boolean | undefined): LogicDoc;
//#endregion
export { PortRef, addNode, connect, deleteNode, disconnect, moveNode, relabel, setGoal, setInputValue, toggleInput };