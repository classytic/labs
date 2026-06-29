'use client';

/**
 * circuit-network asset, a GENERAL circuits template on the @classytic/stage
 * engine (the stage-based successor to the old canvas CircuitBuilder). A circuit
 * is a battery + parallel BRANCHES, each a series chain of components
 * (resistor / bulb / switch). The resolver owns the whole solve (Ohm + series-
 * parallel reduction → per-component current/power/bulb-brightness + the goal
 * check + the schematic layout), exactly like the optics-ray asset owns its ray
 * trace. Switch states + battery EMF are FREE scalars bound in, so the circuit
 * is agent-drivable and the visual can never disagree with the physics.
 *
 * Branch-list model (series / parallel / series-parallel, the intro set), NOT
 * an arbitrary mesh netlist (that needs an MNA solver and risks singular states).
 * SVG: current flow is a CSS-var-driven dash animation that honours
 * prefers-reduced-motion, no per-frame re-resolve, no /canvas needed here.
 */

import type { ReactNode } from 'react';
import {
  useCoords, registerAsset, StageAssetDefs,
  type Vec2, type AssetResolveArgs, type AssetSpec, type AssetGeometry, type ElementStyle,
} from '@classytic/stage';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { num as n } from '../../core/util.js';

type CompType = 'resistor' | 'bulb' | 'switch';
interface Comp { type: CompType; at: Vec2; ohms: number; branch: number; current: number; brightness: number; closed: boolean; label: string }
interface Wire { pts: Vec2[]; energized: boolean }

const TYPE: Record<number, CompType> = { 1: 'resistor', 2: 'bulb', 3: 'switch' };
const REF_V = 6; // bulb reaches full glow at 6 V across it
const XL = -3.2;
const XR = 3.2;
const ROW_GAP = 1.5;
const RETURN_DROP = 2.2; // gap below the lowest branch for the battery return wire (keeps it a closed loop)

const numOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'boolean' ? (v ? 1 : 0) : d);

interface Raw { i: number; type: CompType; ohms: number; branch: number; pos: number; closed: boolean }

/**
 * Solve the branch-list network through the ONE circuit engine (@classytic/stage/circuit
 * MNA): parallel branches between the left bus (node 1) and the ground return (node 0),
 * each a series chain with its own internal nodes; closed switch = near-zero R, open
 * branch = omitted. Returns the totals + per-branch current read back from node voltages.
 */
function solveNetwork(raw: Raw[], nBranch: number, emf: number, internalR: number): { Itotal: number; branchI: number[] } {
  const elems: Elem[] = [];
  let node = 2;
  if (internalR > 1e-9) {
    const bn = node++;
    elems.push({ kind: 'V', n1: bn, n2: 0, value: emf, id: 'batt' });
    elems.push({ kind: 'R', n1: bn, n2: 1, value: internalR });
  } else {
    elems.push({ kind: 'V', n1: 1, n2: 0, value: emf, id: 'batt' });
  }
  const branchOf = (b: number): Raw[] => raw.filter((r) => r.branch === b).sort((a, c) => a.pos - c.pos);
  const first: ({ a: number; b: number; R: number } | null)[] = [];
  for (let b = 0; b < nBranch; b++) {
    const chain = branchOf(b);
    const open = chain.length === 0 || chain.some((r) => r.type === 'switch' && !r.closed);
    if (open) { first[b] = null; continue; }
    let prev = 1; let f: { a: number; b: number; R: number } | null = null;
    chain.forEach((r, idx) => {
      const nb = idx === chain.length - 1 ? 0 : node++;
      const R = r.type === 'switch' ? 1e-6 : Math.max(1e-9, r.ohms);
      elems.push({ kind: 'R', n1: prev, n2: nb, value: R });
      if (!f) f = { a: prev, b: nb, R };
      prev = nb;
    });
    first[b] = f;
  }
  const sol = solveDC(elems);
  const V = sol.nodeV;
  const Itotal = Math.abs(sol.current['batt'] ?? 0);
  const branchI = first.map((f) => (f ? Math.abs(((V[f.a] ?? 0) - (V[f.b] ?? 0)) / f.R) : 0));
  return { Itotal, branchI };
}

function resolver({ params, bound }: AssetResolveArgs): AssetGeometry {
  const nComp = Math.max(0, Math.round(n(params.nComp, 0)));
  const nBranch = Math.max(1, Math.round(n(params.nBranch, 1)));
  const internalR = Math.max(0, n(params.internalR, 0));
  const emf = Math.max(0, numOr(bound.emf, n(params.emf, 6)));
  const goalType = Math.round(n(params.goalType, 0)); // 0 lightBulb, 1 targetCurrent, 2 allLit
  const goalComp = Math.round(n(params.goalComp, -1));
  const goalVal = n(params.goalVal, 0.1);
  const goalTol = n(params.goalTol, 0.05);

  // 1. read components
  const raw: Raw[] = [];
  for (let i = 0; i < nComp; i++) {
    const type = TYPE[Math.round(n(params[`t${i}`], 1))] ?? 'resistor';
    const swIdx = Math.round(n(params[`sw${i}`], -1));
    const closed = type !== 'switch' ? true : numOr(bound[`k${swIdx}`], 1) >= 0.5;
    raw.push({ i, type, ohms: Math.max(0, n(params[`o${i}`], type === 'switch' ? 0 : 1)), branch: Math.round(n(params[`b${i}`], 0)), pos: n(params[`p${i}`], i), closed });
  }

  // 2-3. solve the whole network through the ONE circuit engine (stage/circuit MNA) —
  // this lab shares the same solver as every other; no per-lab series/parallel math.
  const branchOf = (b: number): Raw[] => raw.filter((r) => r.branch === b).sort((a, c) => a.pos - c.pos);
  const { Itotal, branchI } = solveNetwork(raw, nBranch, emf, internalR);

  // 4. layout, a CLOSED rectangular loop, centered vertically on 0: components
  // sit on the branch rungs (the top rung for a single branch), the battery sits
  // on the bottom return wire, and two vertical buses close both ends. This reads
  // as a circuit in every case (the old single-branch path collapsed to a line).
  const branchSpan = (nBranch - 1) * ROW_GAP;
  const loopH = branchSpan + RETURN_DROP;
  const yTop = loopH / 2;       // highest rung
  const yReturn = -loopH / 2;   // bottom return wire (carries the battery)
  const PADX = 1.1;             // keep components off the corner verticals
  const comps: Comp[] = [];
  for (let b = 0; b < nBranch; b++) {
    const yb = yTop - b * ROW_GAP;
    const chain = branchOf(b);
    const Ib = branchI[b] ?? 0;
    const m = chain.length;
    chain.forEach((r, idx) => {
      const x = m === 1 ? 0 : (XL + PADX) + ((XR - PADX) - (XL + PADX)) * (idx / (m - 1));
      const R = r.ohms;
      const vDrop = Ib * R;
      const brightness = r.type === 'bulb' ? Math.max(0, Math.min(1, vDrop / REF_V)) : 0;
      comps.push({ type: r.type, at: { x, y: yb }, ohms: R, branch: b, current: Ib, brightness, closed: r.closed, label: r.type === 'switch' ? '' : `${R}Ω` });
    });
  }

  // 5. wires, left/right buses + bottom return (battery) + one rung per branch;
  // energized when current actually flows through that wire.
  const railEnergized = Itotal > 1e-6;
  const wires: Wire[] = [
    { pts: [{ x: XL, y: yReturn }, { x: XL, y: yTop }], energized: railEnergized },     // left bus
    { pts: [{ x: XR, y: yReturn }, { x: XR, y: yTop }], energized: railEnergized },     // right bus
    { pts: [{ x: XL, y: yReturn }, { x: XR, y: yReturn }], energized: railEnergized },  // bottom return (battery)
  ];
  for (let b = 0; b < nBranch; b++) {
    const yb = yTop - b * ROW_GAP;
    wires.push({ pts: [{ x: XL, y: yb }, { x: XR, y: yb }], energized: (branchI[b] ?? 0) > 1e-6 });
  }

  // 6. goal check
  const bulbs = comps.filter((c) => c.type === 'bulb');
  let solved = false;
  if (goalType === 0) { const t = goalComp >= 0 ? comps[goalComp] : bulbs[0]; solved = !!t && t.type === 'bulb' && t.brightness >= goalVal; }
  else if (goalType === 1) { const I = goalComp >= 0 ? (comps[goalComp]?.current ?? 0) : Itotal; solved = Math.abs(I - goalVal) <= goalTol; }
  else if (goalType === 2) { solved = bulbs.length > 0 && bulbs.every((c) => c.brightness >= 0.1); }

  const flowDur = Itotal > 1e-6 ? Math.max(0.45, Math.min(3, 1.2 / Itotal)) : 0;

  return {
    kind: 'asset-geom',
    parts: { battery: { x: 0, y: yReturn } },
    meta: { comps, wires, emf, Itotal, Rtot: Itotal > 1e-12 ? emf / Itotal : -1, solved, flowDur, energized: railEnergized },
  };
}

function Component({ geom }: { geom: AssetGeometry; style?: ElementStyle; label?: string }): ReactNode {
  const c = useCoords();
  const p = geom.parts as Record<string, Vec2>;
  const m = (geom.meta ?? {}) as { comps: Comp[]; wires: Wire[]; emf: number; Itotal: number; solved: boolean; flowDur: number };
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);
  const HALF = 22; // component half-width in px (FIXED, not scaled, so symbols stay tidy on a wide view)

  const wirePath = (w: Wire): string => w.pts.map((v) => P(v).join(',')).join(' ');

  const renderComp = (comp: Comp, i: number): ReactNode => {
    const [cx, cy] = P(comp.at);
    if (comp.type === 'resistor') {
      const h = 11;
      return (
        <g key={i}>
          {/* clean component body interrupting the wire (matches the VDR/CDR labs) */}
          <rect x={cx - HALF} y={cy - h} width={HALF * 2} height={h * 2} rx={3} fill="var(--stage-bg)" stroke="var(--stage-accent)" strokeWidth={2} />
          <circle cx={cx - HALF} cy={cy} r={2.5} fill="var(--stage-metal)" />
          <circle cx={cx + HALF} cy={cy} r={2.5} fill="var(--stage-metal)" />
          <text x={cx} y={cy - h - 6} fill="var(--stage-fg)" fontSize={11} fontWeight={600} textAnchor="middle">{comp.label}</text>
        </g>
      );
    }
    if (comp.type === 'bulb') {
      const r = 15;
      const glow = comp.brightness;
      const lit = glow > 0.02;
      const fill = lit ? `color-mix(in oklab, var(--stage-warn) ${Math.round(glow * 90)}%, var(--stage-bg))` : 'var(--stage-bg)';
      const d = r * 0.72; // X half-diagonal (≈ r/√2, the cross stays inside the rim)
      const cross = lit ? 'var(--stage-sheen)' : 'var(--stage-metal)';
      const crossOp = lit ? 0.95 : 0.65;
      return (
        <g key={i}>
          {lit && <circle cx={cx} cy={cy} r={r + 7 + 8 * glow} fill="var(--stage-warn)" opacity={0.22 * glow} />}
          <circle cx={cx} cy={cy} r={r} fill={fill} stroke="var(--stage-metal)" strokeWidth={1.75} />
          {/* lamp symbol: circle with an X (⊗), unambiguous, never reads as the AC "~" sign */}
          <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke={cross} strokeWidth={1.5} opacity={crossOp} />
          <line x1={cx - d} y1={cy + d} x2={cx + d} y2={cy - d} stroke={cross} strokeWidth={1.5} opacity={crossOp} />
          <text x={cx} y={cy + r + 15} fill="var(--stage-fg)" fontSize={11} fontWeight={600} textAnchor="middle">{comp.label}</text>
        </g>
      );
    }
    // switch, lever from left terminal; closed horizontal, open lifted
    const lev = comp.closed ? { x: cx + HALF, y: cy } : { x: cx + HALF * 0.5, y: cy - HALF * 0.9 };
    return (
      <g key={i}>
        <line x1={cx - HALF} y1={cy} x2={cx + HALF} y2={cy} stroke="var(--stage-metal)" strokeWidth={0} />
        <circle cx={cx - HALF} cy={cy} r={3.5} fill="var(--stage-metal)" />
        <circle cx={cx + HALF} cy={cy} r={3.5} fill="var(--stage-metal)" />
        <line x1={cx - HALF} y1={cy} x2={lev.x} y2={lev.y} stroke={comp.closed ? 'var(--stage-good)' : 'var(--stage-warn)'} strokeWidth={3} strokeLinecap="round" />
        <text x={cx} y={cy + 22} fill="var(--stage-fg)" fontSize={11} textAnchor="middle">{comp.closed ? 'closed' : 'open'}</text>
      </g>
    );
  };

  const [batx, baty] = P(p.battery ?? { x: 0, y: 0 });
  return (
    <>
      <StageAssetDefs />
      <style>{`@keyframes stage-current-flow{to{stroke-dashoffset:-16}}@media (prefers-reduced-motion:reduce){.stage-current{animation:none!important}}`}</style>
      <g>
        {/* base wires */}
        {m.wires.map((w, i) => <polyline key={`w${i}`} points={wirePath(w)} fill="none" stroke="var(--stage-metal)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />)}
        {/* energised current-flow overlay (dashed, animated) */}
        {m.flowDur > 0 && m.wires.filter((w) => w.energized).map((w, i) => (
          <polyline key={`f${i}`} className="stage-current" points={wirePath(w)} fill="none" stroke="var(--stage-good)" strokeWidth={2.5} strokeDasharray="6 10" strokeLinecap="round" style={{ animation: `stage-current-flow ${m.flowDur}s linear infinite` }} />
        ))}
        {/* battery on the bottom return wire (horizontal wire → vertical plates: long +, short −) */}
        <g>
          <line x1={batx - 4} y1={baty - 11} x2={batx - 4} y2={baty + 11} stroke="var(--stage-metal)" strokeWidth={3} />
          <line x1={batx + 4} y1={baty - 6} x2={batx + 4} y2={baty + 6} stroke="var(--stage-metal)" strokeWidth={3} />
          <text x={batx} y={baty + 24} fill="var(--stage-fg)" fontSize={13} fontWeight={700} textAnchor="middle">{m.emf}V</text>
        </g>
        {m.comps.map(renderComp)}
      </g>
    </>
  );
}

export const CIRCUIT_NETWORK_ASSET: AssetSpec = { resolver, Component };
registerAsset('circuit-network', CIRCUIT_NETWORK_ASSET);
