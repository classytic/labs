/**
 * Per-wire current for the flow animation. The MNA solve (`solveCircuit`) yields node
 * voltages and COMPONENT branch currents, but a net is one equipotential region, so it
 * cannot say how much current each individual WIRE carries. Without that, the renderer
 * animated every wire in an energised net, even dead-end stubs and bypassed branches, so
 * a learner saw "current flowing through every path" regardless of the real circuit.
 *
 * We recover honest per-wire current with a small resistor-network solve: build the graph
 * of pins/nodes joined by wires, give each wire a unit conductance, inject each component's
 * KNOWN terminal current at its pins, and solve the graph Laplacian L·v = b for node
 * potentials. A wire's current is then v_u − v_v. This is exact on a series path (it carries
 * the full loop current), splits evenly across parallel wires, and is ZERO on a dead branch,
 * so the animation flows only where current actually flows. When a wire shorts past a
 * component, that wire carries the current while the component (v ≈ 0 across it) goes dark.
 */

import { getPart } from './registry.js';
import type { CircuitDoc, CircuitSolution, PartInstance } from './contract.js';

const fnum = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
export const pinKey = (id: string, pin: string): string => `${id} ${pin}`;
export const nodeKey = (nid: string): string => `node:${nid}`;

/** current the part drives a→b internally (n1→n2), reused from the part state convention. */
const branchAB = (p: PartInstance, sol: CircuitSolution): number =>
  p.kind === 'resistor' || p.kind === 'bulb'
    ? (sol.pinV(p.id, 'a') - sol.pinV(p.id, 'b')) / fnum(p.props?.ohms, p.kind === 'bulb' ? 100 : 1000)
    : sol.current[p.id] ?? 0;

/** Dense linear solve A·x = b via Gaussian elimination with partial pivoting; null if singular. */
function solveDense(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]!]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[piv]![c]!)) piv = r;
    if (Math.abs(M[piv]![c]!) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv]!, M[c]!];
    const pv = M[c]![c]!;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r]![c]! / pv;
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  return M.map((r, i) => r[n]! / r[i]!);
}

export interface WireFlow {
  /** signed current from pin/node `u` to pin/node `v` (amps); positive = u→v. */
  current: (u: string, v: string) => number;
}

/** Threshold below which a wire is treated as carrying no current (float-noise / open branch). */
export const FLOW_EPS = 1e-6;

export function wireCurrents(doc: CircuitDoc, sol: CircuitSolution): WireFlow {
  if (!sol.ok) return { current: () => 0 };

  // edges: a pin↔node star for every shared node, plus a pin↔pin edge for every wire.
  const edges: [string, string][] = [];
  const nodePins = new Map<string, string[]>();
  for (const p of doc.parts) {
    const def = getPart(p.kind);
    if (!def) continue;
    for (const pin of def.pins) {
      const nid = p.pins?.[pin];
      if (nid) (nodePins.get(nid) ?? nodePins.set(nid, []).get(nid)!).push(pinKey(p.id, pin));
    }
  }
  for (const [nid, pins] of nodePins) if (pins.length >= 2) for (const pk of pins) edges.push([pk, nodeKey(nid)]);
  for (const w of doc.wires ?? []) edges.push([pinKey(w.a.partId, w.a.pin), pinKey(w.b.partId, w.b.pin)]);

  const idx = new Map<string, number>();
  const vid = (k: string): number => { let n = idx.get(k); if (n === undefined) { n = idx.size; idx.set(k, n); } return n; };
  for (const [u, v] of edges) { vid(u); vid(v); }
  const N = idx.size;
  if (N === 0) return { current: () => 0 };

  // inject each component's terminal current: pins[0] sinks −Ib, pins[1] sources +Ib.
  const b = new Array<number>(N).fill(0);
  for (const p of doc.parts) {
    const def = getPart(p.kind);
    if (!def) continue;
    const Ib = branchAB(p, sol);
    const p0 = def.pins[0] ? idx.get(pinKey(p.id, def.pins[0])) : undefined;
    const p1 = def.pins[1] ? idx.get(pinKey(p.id, def.pins[1])) : undefined;
    if (p0 !== undefined) b[p0]! -= Ib;
    if (p1 !== undefined) b[p1]! += Ib;
  }

  // Laplacian (unit conductance per edge) + connected components via union-find.
  const parent = Array.from({ length: N }, (_, i) => i);
  const find = (x: number): number => { while (parent[x] !== x) { parent[x] = parent[parent[x]!]!; x = parent[x]!; } return x; };
  const L = Array.from({ length: N }, () => new Array<number>(N).fill(0));
  for (const [u, v] of edges) {
    const a = idx.get(u)!, c = idx.get(v)!;
    L[a]![a]! += 1; L[c]![c]! += 1; L[a]![c]! -= 1; L[c]![a]! -= 1;
    parent[find(a)] = find(c);
  }

  // ground one vertex per component (Laplacian is singular up to a constant), solve the rest.
  const pots = new Array<number>(N).fill(0);
  const comps = new Map<number, number[]>();
  for (let i = 0; i < N; i++) (comps.get(find(i)) ?? comps.set(find(i), []).get(find(i))!).push(i);
  for (const verts of comps.values()) {
    if (verts.length < 2) continue;
    const unknown = verts.slice(1); // verts[0] grounded at 0
    const A = unknown.map((ri) => unknown.map((cj) => L[ri]![cj]!));
    const rhs = unknown.map((ri) => b[ri]!);
    const x = solveDense(A, rhs);
    if (x) unknown.forEach((vi, i) => { pots[vi] = x[i]!; });
  }

  return {
    current: (u, v) => {
      const iu = idx.get(u), iv = idx.get(v);
      return iu === undefined || iv === undefined ? 0 : pots[iu]! - pots[iv]!;
    },
  };
}
