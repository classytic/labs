'use client';

/**
 * MosfetInsideLab — what actually happens INSIDE an NMOS as you turn the gate.
 *
 * A cross-section of the device: a p-type substrate (holes, +), two n+ wells for the
 * source and drain (electrons, −), a metal gate over a thin oxide. Turn the gate
 * voltage: below threshold the gate just pushes holes away and opens a bare depletion
 * region (no path). Past threshold the surface INVERTS, electrons pulled up from the
 * body form a thin n-channel that bridges source to drain, and with a drain voltage
 * those electrons drift across, the conventional current. The channel on/off and the
 * drain current are the real engine solve (the same MOSFET model as the schematic lab),
 * so the inside view and the circuit always agree.
 */

import { useState, type ReactNode } from 'react';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tag } from '../../kit/electronics.js';
import { useCarrierSim, stepCarriers, recombine, tweenOpacity, inBox, rand, type Carrier, type CType, type Box } from '../../kit/carrier-engine.js';

export interface MosfetInsideProps {
  /** the p-channel mirror: n-substrate, p+ wells, holes form the channel, gate pulled below source. */
  pmos?: boolean;
  vth?: number;
  k?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

// ── geometry (pixel space) ───────────────────────────────────────────────────
const W = 560, H = 320;
const DEV = { x: 40, y: 86, w: 480, h: 200 };       // substrate block
const WELL_W = 96, WELL_TOP = 110, WELL_BOT = 250;   // n+ source/drain wells
const SRC_X = DEV.x + 18, DRN_X = DEV.x + DEV.w - 18 - WELL_W;
const CHAN_X0 = SRC_X + WELL_W, CHAN_X1 = DRN_X;     // channel span (between wells)
const CHAN_Y = WELL_TOP + 6;                          // channel sits at the surface
const OX_Y = WELL_TOP - 12, OX_H = 8;                 // oxide
const GATE_Y = OX_Y - 16, GATE_H = 14;                // metal gate bar
const GATE_X0 = CHAN_X0 - 12, GATE_X1 = CHAN_X1 + 12;

// device-physics colours (tokens + oklch fallback; electron = blue, hole = red)
const ELEC = 'var(--stage-semi-n, oklch(0.62 0.18 250))';
const HOLE = 'var(--stage-semi-p, oklch(0.6 0.19 25))';
const N_FILL = 'color-mix(in oklab, var(--stage-semi-n, oklch(0.62 0.18 250)) 18%, var(--stage-bg))';
const P_FILL = 'color-mix(in oklab, var(--stage-semi-p, oklch(0.6 0.19 25)) 12%, var(--stage-bg))';
const METAL = 'var(--stage-metal)';
const OXIDE = 'color-mix(in oklab, var(--stage-metal) 28%, var(--stage-bg))';
const FG = 'var(--stage-fg)';
const MUTED = 'var(--stage-muted)';

// deterministic scatter: integer-only hash (no Math.sin/Math.random) so it is
// bit-identical on the server and client and never trips a hydration mismatch.
const hash = (i: number, s: number): number => {
  let x = (Math.imul(i + 1, 73856093) ^ Math.imul(s + 1, 19349663)) >>> 0;
  x ^= x >>> 13; x = Math.imul(x, 1274126177) >>> 0; x ^= x >>> 16;
  return (x % 100000) / 100000;
};

// Carriers render on the integer pixel grid (snap like a sprite): clean DOM numbers,
// and bit-identical on server + client regardless of float rounding.
const px = (n: number): number => Math.round(n);

function Electron({ x, y, o = 1 }: { x: number; y: number; o?: number }): ReactNode {
  const cx = px(x), cy = px(y);
  return <g style={{ pointerEvents: 'none' }} opacity={o}><circle cx={cx} cy={cy} r={4.5} fill={ELEC} /><line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke="var(--stage-bg)" strokeWidth={1.4} strokeLinecap="round" /></g>;
}
function Hole({ x, y, o = 1 }: { x: number; y: number; o?: number }): ReactNode {
  const cx = px(x), cy = px(y);
  return <g style={{ pointerEvents: 'none' }} opacity={o}><circle cx={cx} cy={cy} r={4.5} fill="none" stroke={HOLE} strokeWidth={1.6} /><line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke={HOLE} strokeWidth={1.4} strokeLinecap="round" /><line x1={cx} y1={cy - 2} x2={cx} y2={cy + 2} stroke={HOLE} strokeWidth={1.4} strokeLinecap="round" /></g>;
}

/** a spread spawn point that is also the carrier's HOME (so it jiggles there, not wanders off). */
const sited = (b: Box, seed: number): { x: number; y: number; hx: number; hy: number } => {
  const p = inBox(b, seed);
  return { x: p.x, y: p.y, hx: p.x, hy: p.y };
};

/** draw an engine carrier pool as electron / hole glyphs (positions in-bounds, opacity tweened). */
const renderCarriers = (cs: Carrier[]): ReactNode[] => cs
  .filter((c) => (c.o ?? 1) > 0.02)
  .map((c) => (c.t === 'e' ? <Electron key={c.id} x={c.x} y={c.y} o={c.o ?? 1} /> : <Hole key={c.id} x={c.x} y={c.y} o={c.o ?? 1} />));

export function MosfetInsideLab({
  pmos = false, vth = 1.5, k = 0.02,
  title = pmos ? 'Inside the PMOS: the p-channel mirror' : 'Inside the transistor: building the channel',
  prompt = pmos
    ? 'The mirror of the NMOS: an n-type substrate, p+ source and drain, holes as the carriers. Pull the gate BELOW the source and holes are drawn up to invert the surface into a p-channel; the source-drain voltage then drifts them across.'
    : 'Turn the gate voltage. Below the threshold it only clears a depletion region, no path. Past it, electrons are pulled up to invert the surface into an n-channel, and the drain voltage drifts them across as current.',
  ask, activity = pmos ? 'pmos-inside' : 'mosfet-inside',
}: MosfetInsideProps = {}): ReactNode {
  const [Vg, setVg] = useState(0); // NMOS: gate voltage. PMOS: source-gate drive (how far gate is below source).
  const [Vd, setVd] = useState(2); // NMOS: drain V. PMOS: source-drain drive.

  const VDD = 5;
  // real engine solve. NMOS: source = gnd. PMOS: source = VDD, gate/drain pulled below it.
  const elems: Elem[] = pmos
    ? [
        { kind: 'V', n1: 1, n2: 0, value: VDD },
        { kind: 'V', n1: 3, n2: 0, value: VDD - Vg },
        { kind: 'V', n1: 2, n2: 0, value: VDD - Vd },
        { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k, id: 'q' },
      ]
    : [
        { kind: 'V', n1: 3, n2: 0, value: Vg },
        { kind: 'V', n1: 2, n2: 0, value: Vd },
        { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k, id: 'q' },
      ];
  const sol = solveDC(elems);
  const Id = Math.abs(sol.current['q'] ?? 0) * 1000; // mA

  // carrier types & looks mirror for PMOS (substrate ⇄ wells/channel swap n ⇄ p)
  const subFill = pmos ? N_FILL : P_FILL, wellFill = pmos ? P_FILL : N_FILL;
  const wellStroke = pmos ? HOLE : ELEC, chanColor = pmos ? HOLE : ELEC;
  const subLabel = pmos ? 'n-type substrate (electrons, −)' : 'p-type substrate (holes, +)';
  const wellType = pmos ? 'p+' : 'n+';
  const carrierWord = pmos ? 'holes' : 'electrons';
  const chanWord = pmos ? 'p-channel' : 'n-channel';
  const wcT: CType = pmos ? 'h' : 'e'; // well + channel carrier type
  const scT: CType = pmos ? 'e' : 'h'; // substrate majority type

  const on = Vg >= vth && Id > 0.02;
  const inv = Math.max(0, Math.min(1, (Vg - vth) / 2.5));      // inversion strength
  const depl = Math.max(0, Math.min(1, Vg / vth));             // depletion depth (below threshold)
  const deplDepth = depl * 40;
  const DEV_BOT = DEV.y + DEV.h;
  const speed = Math.max(0.4, Math.min(2.4, Id / 1.2));
  const nChan = on ? Math.max(2, Math.round(inv * 9)) : 0;

  // resident carriers (wells + substrate band + body column), gentle thermal jitter,
  // each clamped to its region so none drift onto the gate or out of the device.
  // depletion clears the body column under the gate: its box top tracks deplDepth LIVE
  // (per-frame), so sliding the gate pushes those carriers down smoothly, no rebuild.
  const colBox = (): Box => ({ x: CHAN_X0 + 12, y: CHAN_Y + 16 + deplDepth, w: CHAN_X1 - CHAN_X0 - 24, h: Math.max(8, WELL_BOT - CHAN_Y - 26 - deplDepth) });
  const resident = useCarrierSim(
    () => {
      const wL: Box = { x: SRC_X + 8, y: WELL_TOP + 12, w: WELL_W - 16, h: WELL_BOT - WELL_TOP - 40 };
      const wR: Box = { x: DRN_X + 8, y: WELL_TOP + 12, w: WELL_W - 16, h: WELL_BOT - WELL_TOP - 40 };
      const sb: Box = { x: DEV.x + 16, y: WELL_BOT + 6, w: DEV.w - 32, h: DEV_BOT - WELL_BOT - 16 };
      const col = colBox();
      const out: Carrier[] = [];
      for (let i = 0; i < 7; i++) out.push({ id: i, t: wcT, o: 1, box: wL, ...sited(wL, i * 7 + 1) });
      for (let i = 0; i < 7; i++) out.push({ id: 10 + i, t: wcT, o: 1, box: wR, ...sited(wR, i * 7 + 3) });
      for (let i = 0; i < 7; i++) out.push({ id: 20 + i, t: scT, o: 1, box: sb, ...sited(sb, i * 7 + 5) });
      for (let i = 0; i < 4; i++) out.push({ id: 30 + i, t: scT, o: 1, box: col, ...sited(col, i * 7 + 9) });
      return out;
    },
    (cs, step) => {
      const col = colBox();
      // column carriers re-home as the depletion box moves so they ride it down smoothly
      const boxed = cs.map((c) => (c.id >= 30 && c.id < 40 ? { ...c, box: col, hy: Math.max(col.y + 4, Math.min(col.y + col.h - 4, c.hy ?? col.y + col.h / 2)) } : c));
      return stepCarriers(boxed, step, { x: DEV.x, y: DEV.y, w: DEV.w, h: DEV.h }, { jitter: 0.9, speed: 0.7, damp: 0.85, spring: 0.05 });
    },
    true,
    `${pmos}`,
  );

  // channel carriers stream source→drain (directed). Fixed pool; nChan FADES them in/out,
  // and the sim runs even when off so they fade OUT (not pop) when the channel collapses.
  const MAX_CHAN = 9;
  const chanBox: Box = { x: CHAN_X0 + 4, y: CHAN_Y - 5, w: CHAN_X1 - CHAN_X0 - 8, h: 12 };
  const channel = useCarrierSim(
    () => Array.from({ length: MAX_CHAN }, (_, i): Carrier => ({ id: 200 + i, t: wcT, slot: i, o: 0, box: chanBox, ...inBox(chanBox, 100 + i) })),
    (cs, step) => tweenOpacity(stepCarriers(cs, step, chanBox, { drift: { x: 0.9, y: 0 }, jitter: 0.2, speed: Math.max(0.5, speed), signed: false, damp: 0.9 }), nChan),
    true,
    `${pmos}`,
  );

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${pmos ? 'PMOS' : 'NMOS'} cross-section, gate drive ${Vg.toFixed(1)} volts, channel ${on ? 'formed' : 'absent'}`}>
        {/* substrate */}
        <rect x={DEV.x} y={DEV.y} width={DEV.w} height={DEV.h} rx={10} fill={subFill} stroke={METAL} strokeWidth={1} />
        <Tag x={DEV.x + DEV.w / 2} y={WELL_BOT + 22} text={subLabel} color={MUTED} size={11} weight={500} />
        {/* wells */}
        <rect x={SRC_X} y={WELL_TOP} width={WELL_W} height={WELL_BOT - WELL_TOP} rx={6} fill={wellFill} stroke={wellStroke} strokeWidth={1.2} />
        <rect x={DRN_X} y={WELL_TOP} width={WELL_W} height={WELL_BOT - WELL_TOP} rx={6} fill={wellFill} stroke={wellStroke} strokeWidth={1.2} />
        {/* well labels sit INSIDE the bottom of each well, clear of the S/D terminal leads above */}
        <Tag x={SRC_X + WELL_W / 2} y={WELL_BOT - 8} text={`${wellType} source`} color={wellStroke} size={11} weight={700} />
        <Tag x={DRN_X + WELL_W / 2} y={WELL_BOT - 8} text={`${wellType} drain`} color={wellStroke} size={11} weight={700} />
        {/* depletion region under the gate (below threshold) */}
        {depl > 0.02 && !on && <rect x={GATE_X0} y={CHAN_Y} width={GATE_X1 - GATE_X0} height={6 + deplDepth} fill="color-mix(in oklab, var(--stage-bg) 70%, transparent)" stroke={MUTED} strokeWidth={0.8} strokeDasharray="3 3" />}
        {/* the inversion channel */}
        {inv > 0.02 && <rect x={CHAN_X0} y={CHAN_Y - 4} width={CHAN_X1 - CHAN_X0} height={10} rx={3} fill={`color-mix(in oklab, ${chanColor} ${Math.round(20 + inv * 50)}%, transparent)`} />}
        {/* oxide + gate */}
        <rect x={GATE_X0} y={OX_Y} width={GATE_X1 - GATE_X0} height={OX_H} fill={OXIDE} stroke={METAL} strokeWidth={0.6} />
        <Tag x={GATE_X1 + 6} y={OX_Y + OX_H} text="oxide" color={MUTED} size={9.5} weight={500} anchor="start" />
        <rect x={GATE_X0} y={GATE_Y} width={GATE_X1 - GATE_X0} height={GATE_H} rx={2} fill={METAL} />
        {/* terminals */}
        <Lead x={SRC_X + WELL_W / 2} y1={WELL_TOP} y2={DEV.y - 16} label="S" sub={pmos ? `${VDD} V` : '0 V'} color={MUTED} />
        <Lead x={DRN_X + WELL_W / 2} y1={WELL_TOP} y2={DEV.y - 16} label="D" sub={`${(pmos ? VDD - Vd : Vd).toFixed(1)} V`} color={on ? wellStroke : MUTED} />
        <Lead x={(GATE_X0 + GATE_X1) / 2} y1={GATE_Y} y2={DEV.y - 16} label="G" sub={`${(pmos ? VDD - Vg : Vg).toFixed(1)} V`} color={on ? 'var(--stage-good)' : wellStroke} />
        {/* carriers */}
        {renderCarriers(resident)}
        {renderCarriers(channel)}
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label={pmos ? 'source-gate drive' : 'gate voltage Vg'} value={`${Vg.toFixed(1)} V`}><Slider value={Vg} min={0} max={5} step={0.1} onChange={setVg} ariaLabel="gate drive" /></Field>
      <Field label={pmos ? 'source-drain drive' : 'drain voltage Vd'} value={`${Vd.toFixed(1)} V`}><Slider value={Vd} min={0} max={5} step={0.1} onChange={setVd} ariaLabel="drain drive" /></Field>
    </ControlBar>
  );

  const stage = !inv ? 'off' : !on ? 'depleting' : 'on';
  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={on ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {stage === 'off' ? '✗ gate not yet past threshold, no channel' : stage === 'depleting' ? '… depletion only, still no path' : `✓ channel formed, ${carrierWord} drift S→D`}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>gate drive = <strong>{Vg.toFixed(1)} V</strong> (threshold V<sub>th</sub> = {vth} V)</span>
          <span>drain current I<sub>d</sub> = <strong>{Math.abs(Id) < 0.01 ? '≈ 0' : Id.toFixed(2) + ' mA'}</strong></span>
          <span style={{ color: MUTED }}>{on ? `past threshold the surface inverts: a ${chanWord} of ${carrierWord} bridges source and drain` : `below threshold the gate only opens a depletion region: the ${wellType} wells stay isolated`}</span>
        </div>
      </Callout>
    </div>
  );

  // mastery: the learner drove the gate past threshold so the channel formed and
  // carriers actually drift source→drain (a real conducting channel, not just depletion).
  useCheckpoint({ solved: on, activity: `semiconductor:${activity}` });

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

// ── PN junction (the diode, from the inside) ──────────────────────────────────

export interface PnJunctionProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const PJ = { x: 44, y: 96, w: 472, h: 150, junc: 280 };
const PJ_BOT = PJ.y + PJ.h;

/** A fixed (immobile) ionised dopant core left behind in the depletion region. */
function Ion({ x, y, sign }: { x: number; y: number; sign: '+' | '−' }): ReactNode {
  const col = sign === '+' ? ELEC : HOLE;
  const cx = px(x), cy = px(y);
  return <g style={{ pointerEvents: 'none' }}><circle cx={cx} cy={cy} r={6} fill="none" stroke={col} strokeWidth={1} strokeDasharray="2 1.5" /><text x={cx} y={cy} fill={col} fontSize={9} fontWeight={700} textAnchor="middle" dominantBaseline="central">{sign}</text></g>;
}

export function PnJunctionLab({
  title = 'Inside the diode: the PN junction',
  prompt = 'An n-region (free electrons) meets a p-region (free holes). Where they touch, carriers recombine and leave a depletion region of fixed ions with a built-in field. Bias it: forward narrows the barrier and current floods across; reverse widens it and it blocks.',
  ask, activity = 'pn-junction',
}: PnJunctionProps = {}): ReactNode {
  const [bias, setBias] = useState(0);

  // p side = anode (node 1), n side = cathode (gnd). bias > 0 = forward.
  const sol = solveDC([
    { kind: 'V', n1: 1, n2: 0, value: bias },
    { kind: 'R', n1: 1, n2: 2, value: 40 },
    { kind: 'D', n1: 2, n2: 0, value: 0, id: 'd' },
  ]);
  const Id = (sol.current['d'] ?? 0) * 1000;
  const forward = bias > 0.05 && Id > 0.2;
  const reverse = bias < -0.02;
  // depletion half-width: equilibrium, shrinks forward, grows reverse
  const w = Math.max(7, 24 - (forward ? Math.min(15, Id / 6) : 0) + (reverse ? Math.min(40, -bias * 16) : 0));
  const dL = PJ.junc - w, dR = PJ.junc + w;
  const speed = Math.max(0.5, Math.min(2.2, Id / 12));

  // carrier engine: electrons confined to the n-bulk, holes to the p-bulk. Under forward
  // bias the confine boxes reach across the (thin) junction so carriers stream over and
  // recombine; reverse just widens the carrier-free depletion. Nothing leaves the device.
  const bounds: Box = { x: PJ.x, y: PJ.y, w: PJ.w, h: PJ.h };
  const nBox = (right: number): Box => ({ x: PJ.x + 8, y: PJ.y + 10, w: Math.max(10, right - PJ.x - 12), h: PJ.h - 20 });
  const pBox = (left: number): Box => ({ x: left + 4, y: PJ.y + 10, w: Math.max(10, PJ.x + PJ.w - left - 12), h: PJ.h - 20 });
  // home sites sit in the BULK, clear of the widest depletion, so equilibrium/reverse
  // carriers jiggle there (spread, no clumping). Forward releases them to flow + recombine.
  const nHome: Box = { x: PJ.x + 12, y: PJ.y + 12, w: PJ.junc - 70 - (PJ.x + 12), h: PJ.h - 24 };
  const pHome: Box = { x: PJ.junc + 70, y: PJ.y + 12, w: PJ.x + PJ.w - (PJ.junc + 70) - 12, h: PJ.h - 24 };
  const carriers = useCarrierSim(
    () => {
      const out: Carrier[] = [];
      for (let i = 0; i < 10; i++) out.push({ id: i, t: 'e', ...sited(nHome, i * 5 + 1) });
      for (let i = 0; i < 10; i++) out.push({ id: 100 + i, t: 'h', ...sited(pHome, i * 5 + 3) });
      return out;
    },
    (cs, step) => {
      const eBox = nBox(forward ? PJ.junc + 10 : dL);
      const hBox = pBox(forward ? PJ.junc - 10 : dR);
      const boxed = cs.map((c) => ({ ...c, box: c.t === 'e' ? eBox : hBox }));
      if (forward) {
        const moved = stepCarriers(boxed, step, bounds, { drift: { x: 0.9, y: 0 }, jitter: 0.45, speed, damp: 0.9 });
        return recombine(moved, 12, step, (c) => (c.t === 'e' ? sited(nHome, c.id * 7 + step) : sited(pHome, c.id * 7 + step)));
      }
      // equilibrium / reverse: jiggle on home sites in the bulk
      return stepCarriers(boxed, step, bounds, { jitter: 0.7, speed: 0.7, damp: 0.85, spring: 0.05 });
    },
    true,
    'pn',
  );
  // fixed ions exposed in the depletion region
  const ions: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const y = PJ.y + 26 + i * (PJ.h - 40) / 4;
    if (dL - 14 > PJ.x) ions.push(<Ion key={`in${i}`} x={(PJ.x + dL) / 2 + (hash(i, 7) - 0.5) * (dL - PJ.x - 20)} y={y} sign="+" />);
    if (dR + 14 < PJ.x + PJ.w) ions.push(<Ion key={`ip${i}`} x={(dR + PJ.x + PJ.w) / 2 + (hash(i, 8) - 0.5) * (PJ.x + PJ.w - dR - 20)} y={y} sign="−" />);
  }

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} 300`} width="100%" role="img" aria-label={`PN junction, ${forward ? 'forward biased, conducting' : reverse ? 'reverse biased, blocking' : 'unbiased'}`}>
        {/* n and p bulk */}
        <rect x={PJ.x} y={PJ.y} width={PJ.junc - PJ.x} height={PJ.h} fill={N_FILL} stroke={ELEC} strokeWidth={1} />
        <rect x={PJ.junc} y={PJ.y} width={PJ.x + PJ.w - PJ.junc} height={PJ.h} fill={P_FILL} stroke={HOLE} strokeWidth={1} />
        <Tag x={(PJ.x + dL) / 2} y={PJ.y - 8} text="n-type (electrons −)" color={ELEC} size={12} weight={700} />
        <Tag x={(dR + PJ.x + PJ.w) / 2} y={PJ.y - 8} text="p-type (holes +)" color={HOLE} size={12} weight={700} />
        {/* depletion region */}
        <rect x={dL} y={PJ.y} width={2 * w} height={PJ.h} fill="color-mix(in oklab, var(--stage-bg) 66%, transparent)" stroke="var(--stage-muted)" strokeWidth={0.8} strokeDasharray="3 3" />
        <Tag x={PJ.junc} y={PJ_BOT + 16} text="depletion region (fixed ions, built-in field)" color={MUTED} size={10} weight={500} />
        {/* built-in field arrow (n → p) when not fully forward-collapsed */}
        {w > 9 && <g><line x1={dL + 4} y1={PJ.y + PJ.h / 2} x2={dR - 4} y2={PJ.y + PJ.h / 2} stroke="var(--stage-muted)" strokeWidth={1.4} markerEnd="url(#stage-arrow)" /><Tag x={PJ.junc} y={PJ.y + PJ.h / 2 - 6} text="E" color={MUTED} size={9} weight={500} /></g>}
        {ions}
        {renderCarriers(carriers)}
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="bias voltage" value={`${bias.toFixed(2)} V`}><Slider value={bias} min={-3} max={0.9} step={0.05} onChange={setBias} ariaLabel="bias voltage" /></Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={forward ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {forward ? '✓ forward: barrier thin, carriers flood across' : reverse ? '✗ reverse: barrier wide, it blocks' : '— no bias: equilibrium barrier'}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>bias = <strong>{bias.toFixed(2)} V</strong></span>
          <span>diode current = <strong>{Math.abs(Id) < 0.05 ? '≈ 0' : Id.toFixed(1) + ' mA'}</strong></span>
          <span style={{ color: MUTED }}>{forward ? 'past ~0.6 V the barrier collapses: electrons and holes pour across and recombine' : 'the depletion region is a carrier-free barrier; reverse bias only widens it'}</span>
        </div>
      </Callout>
    </div>
  );

  // mastery: the learner forward-biased the junction so the barrier collapses and
  // current floods across (the diode conducts), not just held it at equilibrium/reverse.
  useCheckpoint({ solved: forward, activity: `semiconductor:${activity}` });

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

// ── Silicon lattice + doping: what makes a semiconductor ──────────────────────

type DopeMode = 'intrinsic' | 'n' | 'p';

export interface SiliconLatticeProps {
  /** doping the lab opens on (default 'intrinsic'). */
  mode?: DopeMode;
  /** initial temperature 0..1 (default 0.2). */
  temperature?: number;
  /** hide the doping toggle so the lab stays on one case (focused authoring). */
  lockDoping?: boolean;
  /** show the temperature slider (default true). */
  showTemperature?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const LAT = { x0: 96, y0: 96, dx: 116, dy: 78, cols: 4, rows: 3 };
const atomAt = (c: number, r: number): { x: number; y: number } => ({ x: LAT.x0 + c * LAT.dx, y: LAT.y0 + r * LAT.dy });
const DOPE_C = 2, DOPE_R = 1; // which atom is the dopant
const C_DONOR = 'var(--stage-good, oklch(0.7 0.15 150))';
const C_ACCEPTOR = 'var(--stage-warn, oklch(0.78 0.15 75))';

function SiAtom({ x, y, label, fill, stroke }: { x: number; y: number; label: string; fill: string; stroke: string }): ReactNode {
  return <g style={{ pointerEvents: 'none' }}><circle cx={px(x)} cy={px(y)} r={17} fill={fill} stroke={stroke} strokeWidth={1.5} /><text x={px(x)} y={px(y)} fill={stroke} fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="central">{label}</text></g>;
}

/** the shared electron pair on a covalent bond (two small dots offset across the bond). */
function Bond({ a, b, broken }: { a: { x: number; y: number }; b: { x: number; y: number }; broken?: boolean }): ReactNode {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const horiz = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
  const ox = horiz ? 0 : 4, oy = horiz ? 4 : 0;
  const dot = 'var(--stage-muted)';
  return (
    <g style={{ pointerEvents: 'none' }}>
      <line x1={px(a.x)} y1={px(a.y)} x2={px(b.x)} y2={px(b.y)} stroke="var(--stage-grid)" strokeWidth={1.4} />
      <circle cx={px(mx - ox)} cy={px(my - oy)} r={2.6} fill={dot} />
      {!broken && <circle cx={px(mx + ox)} cy={px(my + oy)} r={2.6} fill={dot} />}
    </g>
  );
}

export function SiliconLatticeLab({
  mode: mode0 = 'intrinsic', temperature: temp0 = 0.2, lockDoping = false, showTemperature = true,
  title = 'What is a semiconductor? Silicon and doping',
  prompt = 'Pure silicon: every atom shares its four outer electrons in covalent bonds, so almost none are free, a poor conductor. Dope it: a donor atom brings a spare electron (n-type), an acceptor leaves a hole (p-type). Those carriers are what carry current. Heat also frees pairs.',
  ask, activity = 'silicon-lattice',
}: SiliconLatticeProps = {}): ReactNode {
  const [mode, setMode] = useState<DopeMode>(mode0);
  const [temp, setTemp] = useState(temp0);
  const nPairs = Math.round(temp * 4);

  // the dopant's spare carrier is BORN AT THE DOPANT: an n-donor's extra electron beside
  // its +5 core, a p-acceptor's hole in the bond it left short. From there it wanders.
  const dopeAtom = atomAt(DOPE_C, DOPE_R);
  const dopeRight = atomAt(DOPE_C + 1, DOPE_R);
  const elecStart = { x: dopeAtom.x + 22, y: dopeAtom.y - 26 };
  const holeStart = { x: (dopeAtom.x + dopeRight.x) / 2, y: dopeAtom.y };

  // free carriers on the engine: the dopant carrier + thermally generated e–h pairs
  // (more at higher T) that wander and recombine, all clamped to the lattice box.
  const LAT_BOUNDS: Box = { x: LAT.x0 - 26, y: LAT.y0 - 4, w: (LAT.cols - 1) * LAT.dx + 52, h: (LAT.rows - 1) * LAT.dy + 30 };
  const MAX_PAIRS = 4; // fixed pool; temperature fades thermal pairs in/out (no rebuild)
  const carriers = useCarrierSim(
    () => {
      const out: Carrier[] = [];
      if (mode === 'n') out.push({ id: 0, t: 'e', o: 1, x: elecStart.x, y: elecStart.y, hx: elecStart.x, hy: elecStart.y });
      if (mode === 'p') out.push({ id: 1, t: 'h', o: 1, x: holeStart.x, y: holeStart.y, hx: holeStart.x, hy: holeStart.y });
      for (let i = 0; i < MAX_PAIRS; i++) {
        out.push({ id: 10 + i, t: 'e', slot: i, o: 0, ...sited(LAT_BOUNDS, 70 + i) });
        out.push({ id: 30 + i, t: 'h', slot: i, o: 0, ...sited(LAT_BOUNDS, 90 + i) });
      }
      return out;
    },
    (cs, step) => tweenOpacity(stepCarriers(cs, step, LAT_BOUNDS, { jitter: 1.3, speed: 0.85, damp: 0.85, spring: 0.05 }), nPairs),
    true,
    `${mode}`,
  );

  // lattice atoms + bonds
  const atoms: ReactNode[] = [];
  const bonds: ReactNode[] = [];
  for (let r = 0; r < LAT.rows; r++) {
    for (let c = 0; c < LAT.cols; c++) {
      const p = atomAt(c, r);
      const isDope = mode !== 'intrinsic' && c === DOPE_C && r === DOPE_R;
      const fill = isDope ? (mode === 'n' ? `color-mix(in oklab, ${C_DONOR} 22%, var(--stage-bg))` : `color-mix(in oklab, ${C_ACCEPTOR} 24%, var(--stage-bg))`) : 'color-mix(in oklab, var(--stage-semi-n, oklch(0.62 0.18 250)) 14%, var(--stage-bg))';
      const stroke = isDope ? (mode === 'n' ? C_DONOR : C_ACCEPTOR) : ELEC;
      atoms.push(<SiAtom key={`a${c}-${r}`} x={p.x} y={p.y} label={isDope ? (mode === 'n' ? '+5' : '+3') : '+4'} fill={fill} stroke={stroke} />);
      // an acceptor is short exactly ONE electron: only the bond on its right is incomplete (the hole).
      if (c < LAT.cols - 1) { const q = atomAt(c + 1, r); const acc = mode === 'p' && c === DOPE_C && r === DOPE_R; bonds.push(<Bond key={`bh${c}-${r}`} a={p} b={q} broken={acc} />); }
      if (r < LAT.rows - 1) bonds.push(<Bond key={`bv${c}-${r}`} a={p} b={atomAt(c, r + 1)} />);
    }
  }

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} 320`} width="100%" role="img" aria-label={`silicon lattice, ${mode === 'intrinsic' ? 'pure' : mode === 'n' ? 'n-type doped' : 'p-type doped'}`}>
        {bonds}
        {atoms}
        {renderCarriers(carriers)}
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      {!lockDoping && (
        <Field label="doping">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['intrinsic', 'n', 'p'] as DopeMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className="lab-chip" data-active={mode === m}
                style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--stage-grid)', background: mode === m ? 'var(--stage-accent)' : 'transparent', color: mode === m ? 'var(--stage-bg)' : 'var(--stage-fg)' }}>
                {m === 'intrinsic' ? 'pure Si' : m === 'n' ? 'n-type (donor)' : 'p-type (acceptor)'}
              </button>
            ))}
          </div>
        </Field>
      )}
      {showTemperature && (
        <Field label="temperature" value={temp < 0.33 ? 'cool' : temp < 0.66 ? 'warm' : 'hot'}><Slider value={temp} min={0} max={1} step={0.05} onChange={setTemp} ariaLabel="temperature" /></Field>
      )}
    </ControlBar>
  );

  const carrierName = mode === 'n' ? 'free electrons (−)' : mode === 'p' ? 'holes (+)' : nPairs > 0 ? 'thermal electron–hole pairs' : 'almost none';
  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={mode === 'intrinsic' && nPairs === 0 ? 'no' : 'ok'} role="status" style={{ alignSelf: 'flex-start' }}>
        {mode === 'intrinsic' ? (nPairs > 0 ? '~ weak intrinsic conduction (heat frees pairs)' : '✗ pure Si: bonds full, poor conductor') : mode === 'n' ? '✓ n-type: spare electrons carry current' : '✓ p-type: holes carry current'}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          <span>majority carriers: <strong>{carrierName}</strong></span>
          <span style={{ color: MUTED }}>{mode === 'intrinsic' ? 'each Si (+4) shares 4 electrons in bonds, so few are free; heating breaks bonds and frees pairs' : mode === 'n' ? 'the donor (+5) has one electron too many for the bonds: it roams free and carries charge' : 'the acceptor (+3) is one electron short, leaving a hole in a bond that moves like a positive carrier'}</span>
        </div>
      </Callout>
    </div>
  );

  // mastery: the learner produced free carriers, either by doping the lattice
  // (n donor / p acceptor) or, in pure Si, by heating it enough to free thermal e–h pairs.
  // Branch the solve on the active mode so each case reports its own intrinsic condition.
  const latticeSolved = mode === 'intrinsic' ? nPairs > 0 : true;
  useCheckpoint({ solved: latticeSolved, activity: `semiconductor:${activity}:${mode}` });

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

// ── Conduction (Drude): drift velocity from the FIELD, and where Ohm's law comes from ──

export interface ConductionProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const CD = { x: 70, y: 100, w: 420, h: 120 };
const CD_MID = CD.y + CD.h / 2;

export function ConductionLab({
  title = 'Why current flows: electrons drifting in a field',
  prompt = 'A conductor is a sea of free electrons in fixed positive ion cores. With no voltage they only jiggle thermally, fast but going nowhere, so no current. Apply a voltage and the field gives every electron a slow DRIFT on top of that jiggle: that net drift is the current. Double the voltage, double the field, double the drift: current ∝ voltage is Ohm\'s law, from the inside.',
  ask, activity = 'conduction',
}: ConductionProps = {}): ReactNode {
  const [volts, setVolts] = useState(0);
  const Rohm = 50;                                  // bar resistance
  const I = (volts / Rohm) * 1000;                  // mA (Ohm's law)
  const E = volts / 1;                              // field = V / length (length = 1 unit)
  const flowing = volts > 0.02;
  // drift velocity is DERIVED FROM THE FIELD (v = μE), not a hand-tuned constant
  const mu = 0.34;                                  // mobility (px·tick⁻¹ per volt, for display)
  const vDriftPx = mu * E;

  const barBox: Box = { x: CD.x + 10, y: CD.y + 12, w: CD.w - 20, h: CD.h - 24 };
  const electrons = useCarrierSim(
    () => Array.from({ length: 14 }, (_, i): Carrier => ({ id: i, t: 'e', o: 1, box: barBox, ...sited(barBox, i * 7 + 1) })),
    (cs, step) => {
      // each electron's HOME conveyor-belts right at the field-driven drift speed (and wraps);
      // the electron jiggles thermally AROUND its moving home. So the thermal motion stays
      // evenly spread while the whole frame drifts right — drift on jiggle, no pile-up.
      const cs2 = cs.map((c) => {
        let hx = (c.hx ?? c.x) + vDriftPx;
        let x = c.x;
        if (hx > barBox.x + barBox.w - 4) { hx = barBox.x + 4; x = hx; } // home + electron re-enter at the − end
        return { ...c, hx, x };
      });
      return stepCarriers(cs2, step, barBox, { jitter: 1.1, speed: 0.9, damp: 0.82, spring: 0.06 });
    },
    true,
    'conduction',
  );

  // fixed positive ion cores the electrons scatter off (the origin of resistance)
  const ions: ReactNode[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) ions.push(<Ion key={`ion${r}-${c}`} x={CD.x + 44 + c * 66} y={CD.y + 30 + r * 30} sign="+" />);

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} 300`} width="100%" role="img" aria-label={`conductor, ${flowing ? 'voltage applied, electrons drift, current flows' : 'no voltage, no current'}`}>
        <rect x={CD.x} y={CD.y} width={CD.w} height={CD.h} rx={8} fill="color-mix(in oklab, var(--stage-metal) 16%, var(--stage-bg))" stroke="var(--stage-metal)" strokeWidth={1} />
        {/* terminals */}
        <Lead x={CD.x} y1={CD_MID} y2={CD.y - 18} label="−" sub="0 V" color={MUTED} />
        <Lead x={CD.x + CD.w} y1={CD_MID} y2={CD.y - 18} label="+" sub={`${volts.toFixed(1)} V`} color={flowing ? 'var(--stage-good)' : MUTED} />
        {/* the field E points + → − (right → left); electrons drift the OTHER way */}
        {flowing && (
          <g>
            <line x1={CD.x + CD.w / 2 + 30} y1={CD.y - 6} x2={CD.x + CD.w / 2 - 30} y2={CD.y - 6} stroke="var(--stage-muted)" strokeWidth={1.4} markerEnd="url(#stage-arrow)" />
            <Tag x={CD.x + CD.w / 2} y={CD.y - 12} text="field E" color={MUTED} size={10} weight={500} />
          </g>
        )}
        <Tag x={CD.x + CD.w / 2} y={CD.y + CD.h + 18} text="conductor: free electrons (−) in fixed + ion cores" color={MUTED} size={11} weight={500} />
        {ions}
        {renderCarriers(electrons)}
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="applied voltage" value={`${volts.toFixed(1)} V`}><Slider value={volts} min={0} max={5} step={0.1} onChange={setVolts} ariaLabel="applied voltage" /></Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={flowing ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {flowing ? '✓ electrons drift → current flows' : '✗ no field: electrons jiggle, no net flow'}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>field E = V/L = <strong>{E.toFixed(1)}</strong> (∝ voltage)</span>
          <span>drift velocity v = μE = <strong>{(vDriftPx).toFixed(2)}</strong> (a slow bias on fast jiggle)</span>
          <span>current I = V/R = <strong>{I < 0.05 ? '≈ 0' : I.toFixed(1) + ' mA'}</strong></span>
          <span style={{ color: MUTED }}>current ∝ voltage: that proportionality IS Ohm&apos;s law. Collisions with the ion cores limit the drift, that is the resistance R.</span>
        </div>
      </Callout>
    </div>
  );

  // mastery: the learner applied a voltage so the field gives the electrons a net
  // drift on top of the jiggle, current flows (Ohm's law from the inside).
  useCheckpoint({ solved: flowing, activity: `semiconductor:${activity}` });

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

// ── Hall effect: a magnetic field deflects carriers; the Hall voltage SIGN reveals e⁻ vs h⁺ ──

export interface HallProps {
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const HB = { x: 80, y: 100, w: 400, h: 128 };
const HB_MID = HB.y + HB.h / 2;

export function HallEffectLab({
  title = 'The Hall effect: are the carriers electrons or holes?',
  prompt = 'Push a current through a strip in a magnetic field. The field bends the moving carriers sideways, so charge piles up on one edge until a transverse Hall voltage builds. Electrons and holes carrying the SAME current bend to the same edge, but leave OPPOSITE charge there, so the Hall voltage\'s sign tells you which carrier a material has. This is how carrier type is actually measured.',
  ask, activity = 'hall-effect',
}: HallProps = {}): ReactNode {
  const [holes, setHoles] = useState(false); // false = electrons (n-type), true = holes (p-type)
  const [bField, setBField] = useState(0.6); // + = into the page
  const reduceB = Math.abs(bField) < 0.05;
  const I = 30; // current (mA), the longitudinal current (fixed)
  const VH = bField * (holes ? 1 : -1); // sign: + for holes, − for electrons (same current + B)
  const carrierT: CType = holes ? 'h' : 'e';
  // both carrier types deflect to the SAME edge (top for B into page); only the SIGN of the
  // charge that lands there differs → opposite Hall voltage.
  const topEdge = bField >= 0;

  const box: Box = { x: HB.x + 8, y: HB.y + 10, w: HB.w - 16, h: HB.h - 20 };
  const carriers = useCarrierSim(
    () => Array.from({ length: 16 }, (_, i): Carrier => ({ id: i, t: carrierT, o: 1, box, ...sited(box, i * 7 + 1) })),
    (cs, step) => {
      const driftX = (holes ? 1 : -1) * 1.1;             // holes drift +x with the current, electrons −x
      const edgeY = topEdge ? box.y + 14 : box.y + box.h - 14;
      const defl = Math.min(0.85, Math.abs(bField));      // how far carriers are pushed toward that edge
      const cs2 = cs.map((c) => {
        let hx = (c.hx ?? c.x) + driftX;                  // conveyor home (longitudinal current), wraps
        if (hx > box.x + box.w - 4) hx = box.x + 4;
        if (hx < box.x + 4) hx = box.x + box.w - 4;
        const lane = inBox(box, c.id * 7 + 1).y;          // the carrier's original transverse lane
        const hy = lane + (edgeY - (box.y + box.h / 2)) * defl; // bias toward the deflection edge ∝ B
        return { ...c, hx, hy };
      });
      return stepCarriers(cs2, step, box, { jitter: 0.9, speed: 0.9, damp: 0.82, spring: 0.06 });
    },
    true,
    `${holes}`,
  );

  // magnetic-field background symbols (× into page, • out of page)
  const bSyms: ReactNode[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    const x = HB.x + 34 + c * 56, y = HB.y + 26 + r * 38;
    bSyms.push(bField >= 0
      ? <g key={`b${r}-${c}`} style={{ pointerEvents: 'none' }} opacity={reduceB ? 0.12 : 0.3}><line x1={x - 3} y1={y - 3} x2={x + 3} y2={y + 3} stroke="var(--stage-muted)" strokeWidth={1} /><line x1={x - 3} y1={y + 3} x2={x + 3} y2={y - 3} stroke="var(--stage-muted)" strokeWidth={1} /></g>
      : <circle key={`b${r}-${c}`} cx={x} cy={y} r={1.6} fill="var(--stage-muted)" opacity={0.3} />);
  }

  const edgeCharge = (top: boolean): ReactNode => {
    if (reduceB) return null;
    const here = top === topEdge; // the deflection edge
    const sign = here ? (holes ? '+' : '−') : (holes ? '−' : '+');
    const col = (sign === '+') ? HOLE : ELEC;
    const y = top ? HB.y - 4 : HB.y + HB.h + 12;
    return <Tag x={HB.x + HB.w / 2} y={y} text={`${sign} ${sign} ${sign} ${sign} ${sign}`} color={col} size={13} weight={700} />;
  };

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} 300`} width="100%" role="img" aria-label={`Hall bar, ${holes ? 'holes' : 'electrons'}, field ${bField >= 0 ? 'into' : 'out of'} page`}>
        <rect x={HB.x} y={HB.y} width={HB.w} height={HB.h} rx={8} fill="color-mix(in oklab, var(--stage-metal) 12%, var(--stage-bg))" stroke="var(--stage-metal)" strokeWidth={1} />
        {bSyms}
        {/* current direction (conventional, +x) */}
        <g><line x1={HB.x - 36} y1={HB_MID} x2={HB.x - 6} y2={HB_MID} stroke="var(--stage-good)" strokeWidth={2} markerEnd="url(#stage-arrow)" /><Tag x={HB.x - 40} y={HB_MID - 6} text="I" color="var(--stage-good)" size={11} weight={700} anchor="end" /></g>
        <line x1={HB.x + HB.w + 6} y1={HB_MID} x2={HB.x + HB.w + 30} y2={HB_MID} stroke="var(--stage-good)" strokeWidth={2} markerEnd="url(#stage-arrow)" />
        {edgeCharge(true)}
        {edgeCharge(false)}
        <Tag x={HB.x + HB.w / 2} y={HB.y + HB.h + 28} text={`B field ${bField >= 0 ? 'into the page (×)' : 'out of the page (•)'} · carriers: ${holes ? 'holes (+)' : 'electrons (−)'}`} color={MUTED} size={10.5} weight={500} />
        {renderCarriers(carriers)}
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="carrier type">
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => setHoles(false)} style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--stage-grid)', background: !holes ? 'var(--stage-accent)' : 'transparent', color: !holes ? 'var(--stage-bg)' : 'var(--stage-fg)' }}>electrons (n)</button>
          <button type="button" onClick={() => setHoles(true)} style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--stage-grid)', background: holes ? 'var(--stage-accent)' : 'transparent', color: holes ? 'var(--stage-bg)' : 'var(--stage-fg)' }}>holes (p)</button>
        </div>
      </Field>
      <Field label="magnetic field" value={reduceB ? 'off' : bField >= 0 ? 'into page' : 'out of page'}><Slider value={bField} min={-1} max={1} step={0.05} onChange={setBField} ariaLabel="magnetic field" /></Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={reduceB ? 'no' : 'ok'} role="status" style={{ alignSelf: 'flex-start' }}>
        {reduceB ? '— no field: carriers go straight, no Hall voltage' : `✓ carriers bend, ${holes ? 'holes' : 'electrons'} pile on one edge`}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>Hall voltage V<sub>H</sub> = <strong>{reduceB ? '≈ 0' : VH > 0 ? '+ (positive)' : '− (negative)'}</strong></span>
          <span style={{ color: MUTED }}>both carriers bend to the same edge, but electrons leave it negative and holes leave it positive. So V<sub>H</sub> &lt; 0 ⇒ <strong>electrons (n-type)</strong>; V<sub>H</sub> &gt; 0 ⇒ <strong>holes (p-type)</strong>. That sign is how a material&apos;s carrier type is measured.</span>
        </div>
      </Callout>
    </div>
  );

  // mastery: the learner turned the magnetic field on so the carriers bend, charge
  // piles on one edge and a transverse Hall voltage appears (the carrier-type measurement).
  useCheckpoint({ solved: !reduceB, activity: `semiconductor:${activity}` });

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

// ── BJT (NPN / PNP): a small base current controls a large collector current ──

export interface BjtInsideProps {
  pnp?: boolean;
  beta?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const BJ = { y: 100, h: 132 };
const BJ_EM = { x0: 46, x1: 176 };      // emitter
const BJ_BASE = { x0: 176, x1: 232 };   // thin base
const BJ_COL = { x0: 232, x1: 516 };    // collector
const BJ_BOT = BJ.y + BJ.h;
const BJ_MID = BJ.y + BJ.h / 2;

export function BjtInsideLab({
  pnp = false, beta = 100,
  title = pnp ? 'Inside the PNP: base current steers the rest' : 'Inside the NPN: base current steers the rest',
  prompt = 'Forward-bias the base-emitter junction. Carriers pour from the emitter into the THIN base, but only a sliver recombine there (the small base current): the rest are swept across into the collector. A tiny base current controls a much larger collector current.',
  ask, activity = pnp ? 'pnp-bjt' : 'npn-bjt',
}: BjtInsideProps = {}): ReactNode {
  const [vbe, setVbe] = useState(0);

  // Ebers-Moll forward-active (the engine has no BJT model): Ic = Is(e^(Vbe/Vt) − 1), Ib = Ic/β.
  const Vt = 0.02585, Is = 2e-14;
  const Ic = Math.min(50, (vbe > 0 ? Is * (Math.exp(Math.min(vbe / Vt, 40)) - 1) : 0) * 1000); // mA
  const Ib = Ic / beta;
  const on = Ic > 0.05;
  const speed = Math.max(0.5, Math.min(2.6, Ic / 10));

  // NPN: emitter/collector n (electrons), base p (holes). PNP mirrors.
  const emFill = pnp ? P_FILL : N_FILL, baseFill = pnp ? N_FILL : P_FILL;
  const emStroke = pnp ? HOLE : ELEC, baseStroke = pnp ? ELEC : HOLE;
  const emType = pnp ? 'p' : 'n', baseType = pnp ? 'n' : 'p';
  const mT: CType = pnp ? 'h' : 'e'; // emitter/collector/streaming carrier
  const bT: CType = pnp ? 'e' : 'h'; // base majority

  const nStream = on ? Math.max(3, Math.round(3 + Math.min(9, Ic / 4))) : 0;
  const emBox: Box = { x: BJ_EM.x0 + 10, y: BJ.y + 12, w: BJ_EM.x1 - BJ_EM.x0 - 26, h: BJ.h - 24 };
  const colBox: Box = { x: BJ_COL.x0 + 20, y: BJ.y + 12, w: BJ_COL.x1 - BJ_COL.x0 - 40, h: BJ.h - 24 };
  const baseBox: Box = { x: BJ_BASE.x0 + 8, y: BJ.y + 14, w: BJ_BASE.x1 - BJ_BASE.x0 - 16, h: BJ.h - 28 };
  const streamBox: Box = { x: BJ_EM.x1 - 26, y: BJ_MID - BJ.h * 0.26, w: BJ_COL.x0 + 86 - (BJ_EM.x1 - 26), h: BJ.h * 0.52 };

  // emitter / collector / base resident carriers (thermal jitter, region-clamped)
  const resident = useCarrierSim(
    () => {
      const out: Carrier[] = [];
      for (let i = 0; i < 5; i++) out.push({ id: i, t: mT, o: 1, box: emBox, ...sited(emBox, i * 7 + 1) });
      for (let i = 0; i < 7; i++) out.push({ id: 20 + i, t: mT, o: 1, box: colBox, ...sited(colBox, i * 7 + 3) });
      for (let i = 0; i < 3; i++) out.push({ id: 40 + i, t: bT, o: 1, box: baseBox, ...sited(baseBox, i * 7 + 5) });
      return out;
    },
    (cs, step) => stepCarriers(cs, step, { x: BJ_EM.x0, y: BJ.y, w: BJ_COL.x1 - BJ_EM.x0, h: BJ.h }, { jitter: 0.85, speed: 0.65, damp: 0.85, spring: 0.05 }),
    true,
    `${pnp}`,
  );

  // the amplified stream: carriers flow emitter → across the thin base → collector,
  // re-injected at the emitter when they reach the far side (a continuous current). Fixed
  // pool; nStream FADES carriers in/out and the sim always runs so it fades, never pops.
  const MAX_STREAM = 12;
  const stream = useCarrierSim(
    () => Array.from({ length: MAX_STREAM }, (_, i): Carrier => ({ id: 300 + i, t: mT, slot: i, o: 0, box: streamBox, ...inBox(streamBox, 200 + i) })),
    (cs, step) => {
      const moved = stepCarriers(cs, step, streamBox, { drift: { x: 1, y: 0 }, jitter: 0.3, speed: Math.max(0.6, speed), signed: false, damp: 0.9 });
      const wrapped = moved.map((c) => (c.x > streamBox.x + streamBox.w - 6 ? { ...c, x: streamBox.x + 4, y: streamBox.y + 4 + rand(c.id, step) * (streamBox.h - 8) } : c));
      return tweenOpacity(wrapped, nStream);
    },
    true,
    `${pnp}`,
  );

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} 300`} width="100%" role="img" aria-label={`${pnp ? 'PNP' : 'NPN'} transistor, ${on ? 'forward active, conducting' : 'off'}`}>
        <rect x={BJ_EM.x0} y={BJ.y} width={BJ_EM.x1 - BJ_EM.x0} height={BJ.h} fill={emFill} stroke={emStroke} strokeWidth={1} />
        <rect x={BJ_BASE.x0} y={BJ.y} width={BJ_BASE.x1 - BJ_BASE.x0} height={BJ.h} fill={baseFill} stroke={baseStroke} strokeWidth={1} />
        <rect x={BJ_COL.x0} y={BJ.y} width={BJ_COL.x1 - BJ_COL.x0} height={BJ.h} fill={emFill} stroke={emStroke} strokeWidth={1} />
        <Tag x={(BJ_EM.x0 + BJ_EM.x1) / 2} y={BJ_BOT + 16} text={`emitter (${emType})`} color={emStroke} size={11} weight={600} />
        <Tag x={(BJ_BASE.x0 + BJ_BASE.x1) / 2} y={BJ.y - 8} text={`base (${baseType}, thin)`} color={baseStroke} size={10} weight={700} />
        <Tag x={(BJ_COL.x0 + BJ_COL.x1) / 2} y={BJ_BOT + 16} text={`collector (${emType})`} color={emStroke} size={11} weight={600} />
        <Lead x={(BJ_EM.x0 + BJ_EM.x1) / 2} y1={BJ.y} y2={BJ.y - 18} label="E" sub="" color={emStroke} />
        <Lead x={(BJ_BASE.x0 + BJ_BASE.x1) / 2} y1={BJ.y} y2={BJ.y - 40} label="B" sub={`${vbe.toFixed(2)} V`} color={on ? 'var(--stage-good)' : baseStroke} />
        <Lead x={(BJ_COL.x0 + BJ_COL.x1) / 2} y1={BJ.y} y2={BJ.y - 18} label="C" sub="" color={on ? emStroke : 'var(--stage-muted)'} />
        {renderCarriers(resident)}
        {renderCarriers(stream)}
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label={pnp ? 'emitter-base drive' : 'base-emitter Vbe'} value={`${vbe.toFixed(2)} V`}><Slider value={vbe} min={0} max={0.8} step={0.01} onChange={setVbe} ariaLabel="base emitter voltage" /></Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={on ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {on ? `✓ forward active: ${emType}→base→collector stream` : '✗ off: base junction not yet forward biased'}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>base current I<sub>B</sub> = <strong>{Ib < 0.001 ? '≈ 0' : (Ib * 1000).toFixed(1) + ' µA'}</strong></span>
          <span>collector current I<sub>C</sub> = <strong>{Ic < 0.05 ? '≈ 0' : Ic.toFixed(1) + ' mA'}</strong></span>
          <span>gain β = I<sub>C</sub>/I<sub>B</sub> = <strong>{beta}</strong></span>
          <span style={{ color: MUTED }}>the base is so thin that almost every carrier crosses to the collector: a tiny base current commands a {beta}× larger collector current</span>
        </div>
      </Callout>
    </div>
  );

  // mastery: the learner forward-biased the base-emitter junction so carriers pour
  // from emitter across the thin base into the collector, a collector current flows.
  useCheckpoint({ solved: on, activity: `semiconductor:${activity}` });

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;
  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

function Lead({ x, y1, y2, label, sub, color }: { x: number; y1: number; y2: number; label: string; sub: string; color: string }): ReactNode {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 + 8} stroke="var(--stage-wire)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={x} cy={y2 + 8} r={2.6} fill="var(--stage-metal)" />
      <Tag x={x} y={y2 + 2} text={label} color={color} size={12} weight={700} />
      {sub ? <Tag x={x} y={y2 - 10} text={sub} color={color} size={10} weight={500} /> : null}
    </g>
  );
}
