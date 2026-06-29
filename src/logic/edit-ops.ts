/**
 * Pure, immutable transforms for the LogicEditor — every edit returns a NEW LogicDoc so the
 * editor stays undoable/serializable (mirrors the analog builder's editor-ops). A "node" is an
 * input, a gate, or an output. Wires are implicit: a gate input slot (or an output) simply
 * names the source node that feeds it, so connecting = writing that id and deleting a node =
 * clearing every reference to it.
 */

import { getGate } from './registry.js';
import type { LogicDoc } from './contract.js';

/** A point on a node where a wire attaches. `dir:'out'` is a source; `dir:'in'` is a sink. */
export interface PortRef {
  nodeId: string;
  dir: 'out' | 'in';
  /** which input slot, for a multi-input gate sink. */
  slot?: number;
}

const LETTERS = 'ABCDEFGHJKLMN';

function freshId(doc: LogicDoc, prefix: string): string {
  const used = new Set([...doc.inputs, ...doc.gates, ...doc.outputs].map((n) => n.id));
  let k = 1;
  while (used.has(`${prefix}${k}`)) k++;
  return `${prefix}${k}`;
}

/** Add an input / output / gate (kind = 'input' | 'output' | a registered gate kind). */
export function addNode(doc: LogicDoc, kind: string, at: { x: number; y: number }): { doc: LogicDoc; id: string } {
  if (kind === 'input') {
    const id = freshId(doc, 'in');
    const label = LETTERS[doc.inputs.length] ?? id;
    return { doc: { ...doc, inputs: [...doc.inputs, { id, label, value: false, x: at.x, y: at.y }] }, id };
  }
  if (kind === 'output') {
    const id = freshId(doc, 'out');
    const label = doc.outputs.length === 0 ? 'Y' : `Y${doc.outputs.length}`;
    return { doc: { ...doc, outputs: [...doc.outputs, { id, in: '', label, x: at.x, y: at.y }] }, id };
  }
  const def = getGate(kind);
  const arity = def?.arity ?? 2;
  const id = freshId(doc, 'g');
  return { doc: { ...doc, gates: [...doc.gates, { id, kind, in: Array(arity).fill(''), x: at.x, y: at.y }] }, id };
}

/** Move any node to a new position. */
export function moveNode(doc: LogicDoc, id: string, at: { x: number; y: number }): LogicDoc {
  const set = <T extends { id: string }>(n: T): T => (n.id === id ? { ...n, x: at.x, y: at.y } : n);
  return { ...doc, inputs: doc.inputs.map(set), gates: doc.gates.map(set), outputs: doc.outputs.map(set) };
}

/** Wire a source node into a sink (a gate input slot, or an output). No-op for invalid pairs. */
export function connect(doc: LogicDoc, fromId: string, sink: { nodeId: string; slot?: number }): LogicDoc {
  if (!fromId || fromId === sink.nodeId) return doc;
  // a source must be an input or a gate (something with an output)
  const isSource = doc.inputs.some((i) => i.id === fromId) || doc.gates.some((g) => g.id === fromId);
  if (!isSource) return doc;
  return {
    ...doc,
    gates: doc.gates.map((g) => (g.id === sink.nodeId ? { ...g, in: g.in.map((v, i) => (i === (sink.slot ?? 0) ? fromId : v)) } : g)),
    outputs: doc.outputs.map((o) => (o.id === sink.nodeId ? { ...o, in: fromId } : o)),
  };
}

/** Clear the wire feeding a sink slot. */
export function disconnect(doc: LogicDoc, sink: { nodeId: string; slot?: number }): LogicDoc {
  return {
    ...doc,
    gates: doc.gates.map((g) => (g.id === sink.nodeId ? { ...g, in: g.in.map((v, i) => (i === (sink.slot ?? 0) ? '' : v)) } : g)),
    outputs: doc.outputs.map((o) => (o.id === sink.nodeId ? { ...o, in: '' } : o)),
  };
}

/** Delete a node and clear every reference to it. */
export function deleteNode(doc: LogicDoc, id: string): LogicDoc {
  return {
    ...doc,
    inputs: doc.inputs.filter((i) => i.id !== id),
    gates: doc.gates.filter((g) => g.id !== id).map((g) => ({ ...g, in: g.in.map((v) => (v === id ? '' : v)) })),
    outputs: doc.outputs.filter((o) => o.id !== id).map((o) => (o.in === id ? { ...o, in: '' } : o)),
  };
}

/** Toggle / set a primary input's value. */
export function setInputValue(doc: LogicDoc, id: string, value: boolean): LogicDoc {
  return { ...doc, inputs: doc.inputs.map((i) => (i.id === id ? { ...i, value } : i)) };
}
export function toggleInput(doc: LogicDoc, id: string): LogicDoc {
  return { ...doc, inputs: doc.inputs.map((i) => (i.id === id ? { ...i, value: !i.value } : i)) };
}

/** Rename a node's label (any node type). */
export function relabel(doc: LogicDoc, id: string, label: string): LogicDoc {
  const set = <T extends { id: string; label?: string }>(n: T): T => (n.id === id ? { ...n, label } : n);
  return { ...doc, inputs: doc.inputs.map(set), gates: doc.gates.map(set), outputs: doc.outputs.map(set) };
}

/** Set / clear an output's goal value (for graded build challenges). */
export function setGoal(doc: LogicDoc, outId: string, goal: boolean | undefined): LogicDoc {
  return { ...doc, outputs: doc.outputs.map((o) => (o.id === outId ? { ...o, goal } : o)) };
}
