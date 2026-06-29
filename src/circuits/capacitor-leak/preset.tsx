'use client';

/**
 * CapacitorLeakLab, why a capacitor charges, holds, and (slowly) LEAKS.
 *
 * A textbook RC loop: a cell charges a capacitor C through a resistor R. Flip
 * the switch to "leak" and the cell is disconnected, the capacitor discharges
 * through its own leakage resistance, the field between the plates thins, drips
 * fall off the lower plate, and Vc decays exponentially. One source of truth , 
 * Vc(t), integrated by the shared `useFrameLoop` clock, drives the plate field,
 * the drips, the live readout, and the Vc–t trace, so they can never disagree.
 *
 * Time-dependent physics lives in the COMPONENT (the pure scene resolver runs
 * once per resolve and can't integrate an ODE); the symbols are the tokenized
 * @classytic/stage electronics glyphs, so the schematic stays exam-standard and
 * rethemes with `--stage-*`. SVG only, honours prefers-reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useInView } from '@classytic/stage';
import { RateCore, type RateState } from '@classytic/stage/sim';
import { CellGlyph, ResistorGlyph, CapacitorGlyph } from '../../kit/electronics.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { HintLadder, useHints, useCheckpoint } from '../../kit/pedagogy.js';

export interface CapacitorLeakProps {
  /** Source EMF in volts. */
  emf?: number;
  /** Charging resistance in kΩ. */
  rK?: number;
  /** Capacitance in µF. */
  capU?: number;
  /** Leakage resistance in kΩ (larger ⇒ slower self-discharge). */
  leakK?: number;
  /** Start with the capacitor already full. */
  startCharged?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}

// schematic geometry (px), a rectangular loop, all devices on the top edge
const W = 440, H = 250;
const xL = 60, xR = 380, yT = 80, yB = 172;
const CELL_X = 130, R_X = 230, CAP_X = 330, DEV_HALF = 30;
const GRAPH = { x: xL, y: 196, w: xR - xL, h: 44 };

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function CapacitorLeakLab({
  emf = 6, rK = 10, capU = 100, leakK = 200, startCharged = false,
  title = 'Charging & leaking a capacitor',
  prompt = 'Charge it up, then flip to “leak”, watch the field thin and Vc decay.',
  objectives, hints = [],
}: CapacitorLeakProps): ReactNode {
  const [V, setV] = useState(emf);
  const [R, setR] = useState(rK);
  const [C, setC] = useState(capU);
  const [leak, setLeak] = useState(leakK);
  const [mode, setMode] = useState<'charge' | 'leak'>('charge');

  // Vc(t) is the shared `rate` core: dVc/dt = (target − Vc)/τ. Charge → target = V,
  // τ = R·C; leak → target = 0, τ = leakR·C. Exact exponential (no Euler drift), and
  // the same ODE behind decay/cooling. Controls write target/τ each frame (no reset).
  const rate = useRef<RateState>(RateCore.reset({ value0: startCharged ? emf : 0, trace: 160 }));
  const leakPhase = useRef(0);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  // τ = R·C. R in kΩ (×1e3), C in µF (×1e-6) ⇒ τ = R·C·1e-3 seconds.
  const tauCharge = (R * C) / 1000;
  const tauLeak = (leak * C) / 1000;
  const target = mode === 'charge' ? V : 0;
  const tau = Math.max(1e-3, mode === 'charge' ? tauCharge : tauLeak);

  useFrameTick(!reduce && inView, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    rate.current = RateCore.step({ ...rate.current, target, tau }, dt);
    if (mode === 'leak' && rate.current.value > 0.01) leakPhase.current = (leakPhase.current + dt * 0.7) % 1;
  });

  const vc = rate.current.value;
  const q = V > 0 ? clamp01(vc / V) : 0;
  const charging = mode === 'charge' && q < 0.995;
  const leaking = mode === 'leak' && q > 0.01;
  const hint = useHints(hints);

  // Solved = the learner has run the discharge to near-empty: in "leak" mode the
  // voltage fraction has decayed to ≤ 5% (several time constants), so the field
  // has thinned to nothing. Feeds the hint ladder into a real formative loop.
  const solved = mode === 'leak' && q <= 0.05;
  useCheckpoint({ solved, activity: `capacitor-leak:${title}`, hintsUsed: hint.count });

  // Vc–t trace: scale the latest samples into the graph box.
  const sampleArr = rate.current.samples;
  const trace = sampleArr.length > 1
    ? sampleArr.map((s, i) => {
        const x = GRAPH.x + (i / (sampleArr.length - 1)) * GRAPH.w;
        const y = GRAPH.y + GRAPH.h - (V > 0 ? s / V : 0) * (GRAPH.h - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ')
    : '';

  const wire = (x1: number, y1: number, x2: number, y2: number, live: boolean): ReactNode => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={live ? 'var(--stage-live)' : 'var(--stage-wire)'} strokeWidth={2.5} strokeLinecap="round" />
  );

  const figure = (
    <>
      <div ref={viewRef} className="lab-playwrap" style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
          aria-label={`RC circuit, capacitor at ${Math.round(q * 100)} percent, ${mode === 'charge' ? 'charging' : 'leaking'}`}>
          {/* loop wires (left edge carries the charge/leak switch) */}
          {wire(xL, yT, CELL_X - DEV_HALF, yT, charging)}
          {wire(CELL_X + DEV_HALF, yT, R_X - DEV_HALF, yT, charging)}
          {wire(R_X + DEV_HALF, yT, CAP_X - DEV_HALF, yT, charging)}
          {wire(CAP_X + DEV_HALF, yT, xR, yT, charging)}
          {wire(xR, yT, xR, yB, charging)}
          {wire(xR, yB, xL, yB, charging)}
          {/* left edge = switch: closed (charge) connects, open (leak) breaks it */}
          {mode === 'charge'
            ? wire(xL, yB, xL, yT, charging)
            : (
              <g>
                {wire(xL, yB, xL, yT - 26, false)}
                <line x1={xL} y1={yT - 26} x2={xL + 16} y2={yT - 40} stroke="var(--stage-warn)" strokeWidth={3} strokeLinecap="round" />
                <circle cx={xL} cy={yT - 26} r={3} fill="var(--stage-metal)" />
                <circle cx={xL} cy={yT} r={3} fill="var(--stage-metal)" />
              </g>
            )}

          {/* devices (their leads ARE the wire between nodes) */}
          <CellGlyph cx={CELL_X} cy={yT} half={DEV_HALF} live={charging} label={`${V} V`} />
          <ResistorGlyph cx={R_X} cy={yT} half={DEV_HALF} live={charging} label={`${R} kΩ`} />
          <CapacitorGlyph cx={CAP_X} cy={yT} half={DEV_HALF} charge={q} leaking={leaking} leakPhase={leakPhase.current} live={charging} label={`${C} µF`} />

          {/* Vc–t trace */}
          <rect x={GRAPH.x} y={GRAPH.y} width={GRAPH.w} height={GRAPH.h} rx={4} fill="none" stroke="var(--stage-grid)" strokeWidth={1} />
          <text x={GRAPH.x + 4} y={GRAPH.y + 12} fill="var(--stage-muted)" fontSize={10}>Vc vs t</text>
          {trace && <polyline points={trace} fill="none" stroke="var(--stage-charge)" strokeWidth={2} strokeLinejoin="round" />}
        </svg>
      </div>
      <LiveRegion>
        {`Capacitor ${Math.round(q * 100)} percent, ${mode}. Vc ${vc.toFixed(1)} volts.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="mode" value={<span style={{ fontVariantNumeric: 'tabular-nums' }}>Vc {vc.toFixed(2)} V · {Math.round(q * 100)}% · τ {tau.toFixed(2)} s</span>}>
        <span style={{ display: 'flex', gap: 10 }}>
          <Chip selected={mode === 'charge'} onClick={() => setMode('charge')}>⚡ Charge</Chip>
          <Chip selected={mode === 'leak'} onClick={() => setMode('leak')}>💧 Leak</Chip>
        </span>
      </Field>
      <Field label="EMF" value={`${V} V`}><Slider value={V} min={1} max={12} step={1} onChange={setV} ariaLabel="EMF (volts)" /></Field>
      <Field label="R" value={`${R} kΩ`}><Slider value={R} min={1} max={100} step={1} onChange={setR} ariaLabel="charging resistance (kilohm)" /></Field>
      <Field label="C" value={`${C} µF`}><Slider value={C} min={10} max={1000} step={10} onChange={setC} ariaLabel="capacitance (microfarad)" /></Field>
      <Field label="leak R" value={`${leak} kΩ`}><Slider value={leak} min={20} max={1000} step={10} onChange={setLeak} ariaLabel="leakage resistance (kilohm)" /></Field>
    </ControlBar>
  );

  const footer = <HintLadder hints={hint} />;

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
