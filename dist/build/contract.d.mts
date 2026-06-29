import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";
import { Elem } from "@classytic/stage/circuit";

//#region src/build/contract.d.ts
type PartKind = string;
/** A placed component instance. */
interface PartInstance {
  id: string;
  kind: PartKind;
  /** centre on the canvas, pixels. */
  at: Vec2;
  /** 'h' = terminals left/right, 'v' = top/bottom (2-terminal parts). */
  orient?: 'h' | 'v';
  /** value / vth / closed / label … (the part's tunables). */
  props?: Record<string, number | string | boolean>;
  /** pin id → node id it connects to. */
  pins: Record<string, string>;
}
/** An electrical node (junction) with a canvas position. `id === 'gnd'` is the reference. */
interface CNode {
  id: string;
  at: Vec2;
}
/** One end of a wire: a specific pin of a specific part. */
interface PinRef {
  partId: string;
  pin: string;
}
/**
 * A wire is its OWN edge between two pin terminals. Parts keep their positions; the
 * wire routes between them. Electrical nets are derived by union-find over wires (plus
 * any pins that share a node id), so connecting two pins never drags parts together.
 */
interface Wire {
  id: string;
  a: PinRef;
  b: PinRef;
  /** optional bend points the wire routes through (drag to position the wire's path). */
  mid?: Vec2[];
}
/** A circuit, the serializable source of truth. */
interface CircuitDoc {
  parts: PartInstance[];
  nodes: CNode[];
  /** explicit wire edges (the editor's connection model). */
  wires?: Wire[];
  size?: {
    w: number;
    h: number;
  };
}
interface CircuitSolution {
  /** node voltage by node id (each pin's node id resolves to its net voltage). */
  nodeV: Record<string, number>;
  /** branch current by part id (sources / diodes / mosfets / closed switches). */
  current: Record<string, number>;
  ok: boolean;
  /** part ids whose two terminals collapsed onto the same net (a dead short across a source). */
  shorted: string[];
  /** voltage at a specific pin (net-accurate). */
  pinV: (partId: string, pin: string) => number;
  /** net number a pin belongs to (0 = ground). */
  net: (partId: string, pin: string) => number;
}
/** What a part's glyph needs from the solve to draw itself. */
interface PartState {
  /** current is flowing through this part. */
  live: boolean;
  /** representative current through the part, amps (signed). */
  i: number;
  /** representative voltage across the part, volts. */
  v: number;
  /** power the part dissipates, watts (|v·i|). */
  power: number;
  /** the part is being destroyed: it exceeds a rated limit. `overpower` = dissipating more
   *  than its power rating (it overheats / burns out); `overvoltage` = the voltage across it
   *  exceeds its breakdown rating. undefined = within ratings. Drives the "you fried it" signal. */
  damage?: 'overpower' | 'overvoltage';
  /** voltage at one of this part's pins. */
  pinV: (pin: string) => number;
}
/** A tunable a part exposes to the inspector as a friendly labelled field (vs a raw prop key). */
interface PartControl {
  /** the prop key it edits. */
  key: string;
  label: string;
  /** unit shown after the value (e.g. 'V', 'Ω'). */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}
/** The one extension point: register a part once to make it placeable + solvable + drawable. */
interface PartDef {
  kind: PartKind;
  label: string;
  /** pin ids (e.g. ['a','b'] or ['d','s','g']). */
  pins: string[];
  defaultProps?: Record<string, number | string | boolean>;
  /** the part's tunables, rendered as labelled inspector fields (falls back to defaultProps). */
  controls?: PartControl[];
  /** world position of a pin's terminal, given the instance (handles orientation). */
  terminalAt(inst: PartInstance, pin: string): Vec2;
  /** map this instance to engine elements; nodeNum(pin) resolves a pin to an engine node number. */
  toElems(inst: PartInstance, nodeNum: (pin: string) => number): Elem[];
  /** draw the glyph at the instance centre with its solved state. */
  render(inst: PartInstance, state: PartState): ReactNode;
  /**
   * If the part can be operated by tapping it (e.g. a switch), return the props patch
   * a tap applies; return null for inert parts. Drives click-on-the-circuit interaction.
   */
  tap?(inst: PartInstance): Record<string, number | string | boolean> | null;
}
//#endregion
export { CNode, CircuitDoc, CircuitSolution, PartDef, PartInstance, PartKind, PartState, PinRef, Wire };