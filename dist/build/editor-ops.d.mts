import { CircuitDoc, PinRef } from "./contract.mjs";
import { Vec2 } from "@classytic/stage";

//#region src/build/editor-ops.d.ts
/** Add a part; each pin starts on its own fresh node (unconnected). The first cell's −
 *  terminal is tied to ground so the network always has a reference. */
declare function addPart(doc: CircuitDoc, kind: string, at: Vec2): CircuitDoc;
declare function movePart(doc: CircuitDoc, id: string, at: Vec2): CircuitDoc;
declare function updateProps(doc: CircuitDoc, id: string, patch: Record<string, number | string | boolean>): CircuitDoc;
declare function rotatePart(doc: CircuitDoc, id: string): CircuitDoc;
/**
 * Drop junction nodes that have fewer than 2 wire connections AND their dangling wires, to a
 * fixpoint. This is an EXPLICIT "tidy" the UI can offer; it is NOT run automatically, because a
 * node a user just placed (or is half-way wiring) legitimately has 0 or 1 connection and must
 * not vanish under them.
 */
declare function pruneJunctions(doc: CircuitDoc): CircuitDoc;
declare function deletePart(doc: CircuitDoc, id: string): CircuitDoc;
/** Connect two pins with a NEW wire edge (parts keep their positions). No-op for a
 *  self-link, a duplicate of an existing wire, or an endpoint whose part/pin
 *  doesn't exist (an invalid edge that would persist as an invisible no-op). */
declare function connect(doc: CircuitDoc, a: PinRef, b: PinRef): CircuitDoc;
/** Add a wire the way a user DRAWS one: it is always created (even between pins already on the
 *  same net, e.g. a deliberately-routed redundant path) so a drawn wire never silently vanishes.
 *  Only a self-link or an endpoint that doesn't exist is rejected. Carries optional bend points. */
declare function addWire(doc: CircuitDoc, a: PinRef, b: PinRef, mids?: Vec2[]): CircuitDoc;
/** Remove a wire edge. Low-level: callers that may orphan a junction wrap with pruneJunctions. */
declare function removeWire(doc: CircuitDoc, wireId: string): CircuitDoc;
/** Re-target ONE end of a wire to a different pin (drag-to-detach / reconnect). Rejects a move
 *  that would make the wire a self-loop, or that points at a pin which doesn't exist. */
declare function retargetWire(doc: CircuitDoc, wireId: string, end: 'a' | 'b', to: PinRef): CircuitDoc;
/** Remove a wire (the editor's delete-wire action). Junctions are left in place, never
 *  auto-removed, so nothing the user placed disappears unexpectedly. */
declare function disconnectWire(doc: CircuitDoc, wireId: string): CircuitDoc;
/** World position of a pin's terminal (via its PartDef), for geometry on the doc. */
declare function terminalOf(doc: CircuitDoc, ref: PinRef): Vec2 | undefined;
/** The full polyline a wire draws: through its bend points if it has any, else the default
 *  Manhattan elbow. The renderer, hit-test, and tap all route through this one function. */
declare function wirePolyline(ta: Vec2, mids: Vec2[], tb: Vec2): Vec2[];
/** Set (or clear, when empty) a wire's bend points. */
declare function setWireWaypoints(doc: CircuitDoc, wireId: string, mids: Vec2[]): CircuitDoc;
/** Place a free junction (a 'node' part) at a point; returns its pin for wiring. */
declare function addJunction(doc: CircuitDoc, at: Vec2): {
  doc: CircuitDoc;
  pin: PinRef;
};
/**
 * Tap an existing wire at a point: drop a junction ON the wire (projected onto its route)
 * and SPLIT the wire into two that meet there, so a new lead can branch off mid-span. The
 * junction is a `node` part (no element), so the three wires share one net and the solver
 * needs no special mid-wire case. Returns the junction pin to wire the new lead to.
 */
declare function tapWire(doc: CircuitDoc, wireId: string, at: Vec2): {
  doc: CircuitDoc;
  pin: PinRef;
};
/** Drop a part ONTO a wire: insert it in series. The wire is removed and the part's two
 *  ends are wired to the wire's two original endpoints (a → pin0, pin1 → b). */
declare function spliceIntoWire(doc: CircuitDoc, wireId: string, kind: string, at: Vec2): CircuitDoc;
/** Toggle a pin's connection to ground. Grounding ties the pin's net to the reference;
 *  toggling again gives the pin a fresh independent node (un-grounds it), so a short made
 *  by grounding both terminals of a source can always be undone. */
declare function setGround(doc: CircuitDoc, ref: PinRef): CircuitDoc;
//#endregion
export { addJunction, addPart, addWire, connect, deletePart, disconnectWire, movePart, pruneJunctions, removeWire, retargetWire, rotatePart, setGround, setWireWaypoints, spliceIntoWire, tapWire, terminalOf, updateProps, wirePolyline };