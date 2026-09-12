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
import { useInView, Polyline, Segment, Dot, Label } from '@classytic/stage';
import { RateCore, type RateState } from '@classytic/stage/sim';
import { CellGlyph, ResistorGlyph, CapacitorGlyph } from '../../kit/electronics/index.js';
import { CoordPlane } from '../../kit/coords.js';
import { Slider, Chip } from '../../kit/controls.js';
import { Field, StatList, Stat, LiveRegion } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import { withAuthoredObjectives, type AuthoredActivity } from '../../kit/activity-authoring.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { HintLadder, useHints, useCheckpoint } from '../../kit/pedagogy.js';
import { capacitorLeakActivity } from './activity-plan.js';

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
  activity?: string | AuthoredActivity;
}

// schematic geometry (px), a rectangular loop, all devices on the top edge. The Vc–t
// graph is now a real CoordPlane below the schematic (axes/units/reference), not a
// cramped unlabelled rect inside the diagram.
const W = 440,
  H = 200;
const xL = 60,
  xR = 380,
  yT = 80,
  yB = 172;
const CELL_X = 130,
  R_X = 230,
  CAP_X = 330,
  DEV_HALF = 30;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function CapacitorLeakLab({
  emf = 6,
  rK = 10,
  capU = 100,
  leakK = 200,
  startCharged = false,
  title = 'Charging & leaking a capacitor',
  prompt = 'Charge it up, then flip to “leak”, watch the field thin and Vc decay.',
  objectives,
  hints = [],
  activity = 'capacitor-leak',
}: CapacitorLeakProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'capacitor-leak';
  const authoredActivity =
    typeof activity === 'string' ? withAuthoredObjectives(capacitorLeakActivity, objectives) : activity;
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

  const wire = (x1: number, y1: number, x2: number, y2: number, live: boolean): ReactNode => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={live ? 'var(--stage-accent)' : 'var(--stage-wire)'}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  );

  // Vc–t graph data: the rolling sample buffer → (normalised time, volts). A real graph
  // (axes, units, EMF reference line, live value dot) instead of a bare 44px rect.
  const samples = rate.current.samples;
  const maxY = Math.max(V, ...(samples.length ? samples : [1])) * 1.08;
  const tracePts = samples.map((s, i) => ({ x: samples.length > 1 ? i / (samples.length - 1) : 0, y: s }));

  const figure = (
    <>
      <div ref={viewRef} className="lab-playwrap electronics-scene">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={`RC circuit, capacitor at ${Math.round(q * 100)} percent, ${mode === 'charge' ? 'charging' : 'leaking'}`}
        >
          {/* loop wires (left edge carries the charge/leak switch) */}
          {wire(xL, yT, CELL_X - DEV_HALF, yT, charging)}
          {wire(CELL_X + DEV_HALF, yT, R_X - DEV_HALF, yT, charging)}
          {wire(R_X + DEV_HALF, yT, CAP_X - DEV_HALF, yT, charging)}
          {wire(CAP_X + DEV_HALF, yT, xR, yT, charging)}
          {wire(xR, yT, xR, yB, charging)}
          {wire(xR, yB, xL, yB, charging)}
          {/* left edge = switch: closed (charge) connects, open (leak) breaks it */}
          {mode === 'charge' ? (
            wire(xL, yB, xL, yT, charging)
          ) : (
            <g>
              {wire(xL, yB, xL, yT - 26, false)}
              <line
                x1={xL}
                y1={yT - 26}
                x2={xL + 16}
                y2={yT - 40}
                stroke="var(--stage-warn)"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={xL} cy={yT - 26} r={3} fill="var(--stage-metal)" />
              <circle cx={xL} cy={yT} r={3} fill="var(--stage-metal)" />
            </g>
          )}

          {/* devices (their leads ARE the wire between nodes) */}
          <CellGlyph cx={CELL_X} cy={yT} half={DEV_HALF} live={charging} label={`${V} V`} />
          <ResistorGlyph cx={R_X} cy={yT} half={DEV_HALF} live={charging} label={`${R} kΩ`} />
          <CapacitorGlyph
            cx={CAP_X}
            cy={yT}
            half={DEV_HALF}
            charge={q}
            leaking={leaking}
            leakPhase={leakPhase.current}
            live={charging}
            label={`${C} µF`}
          />
        </svg>
      </div>

      {/* Vc–t graph: real axes + units + the target reference line + a live value dot */}
      <CoordPlane
        view={{ xMin: 0, xMax: 1, yMin: 0, yMax: maxY }}
        height={150}
        preserveAspect={false}
        stepX={0.25}
        stepY={Math.max(1, Math.round(maxY / 4))}
        ariaLabel={`capacitor voltage over time, now ${vc.toFixed(1)} volts`}
      >
        <Segment
          from={{ x: 0, y: target }}
          to={{ x: 1, y: target }}
          color="var(--stage-muted)"
          weight={1}
          dashed
        />
        {/* Past the y tick numbers, which sit just inside the axis: at 0.015 "target 6 V" was
            written over the "6". */}
        <Label
          x={0.06}
          y={target}
          text={mode === 'charge' ? `target ${V} V` : 'target 0 V'}
          color="var(--stage-muted)"
          size={10}
          dx={2}
          dy={-4}
          anchor="start"
        />
        {tracePts.length > 1 && <Polyline points={tracePts} color="var(--stage-accent)" weight={2.5} />}
        {tracePts.length > 1 && <Dot x={1} y={vc} r={5} color="var(--stage-accent)" />}
        {/* Under the time axis. The trace scrolls, so "now" is always the right edge and every
            spot inside the plot is crossed by the curve at some point; the tick numbers sit above
            the axis, which leaves the band below it empty. */}
        <Label
          x={1}
          y={0}
          dy={16}
          text="Vc (V)  vs  time →"
          color="var(--stage-muted)"
          size={10}
          anchor="end"
        />
        {tracePts.length < 2 && (
          <Label
            x={0.5}
            y={maxY * 0.5}
            text="Press Charge to begin"
            color="var(--stage-muted)"
            size={12}
            anchor="middle"
          />
        )}
      </CoordPlane>

      <LiveRegion>
        {`Capacitor ${Math.round(q * 100)} percent, ${mode}. Vc ${vc.toFixed(1)} volts.`}
      </LiveRegion>
    </>
  );

  // measurements: a small instrument panel beside the circuit (the review's V/I/P panel).
  const aside = (
    <StatList>
      <Stat
        label={
          <>
            V<sub>C</sub>
          </>
        }
        value={`${vc.toFixed(2)} V`}
        tone={charging ? 'good' : leaking ? 'warn' : undefined}
      />
      <Stat label="charge" value={`${Math.round(q * 100)} %`} />
      <Stat label="τ = R·C" value={`${tau.toFixed(2)} s`} />
      <span className="electronics-explanation electronics-note-small">
        {charging
          ? 'filling: 63% of the way in one τ'
          : leaking
            ? 'draining: down to 37% in one τ'
            : 'settled'}
      </span>
    </StatList>
  );

  const controls = (
    <>
      <Field label="mode">
        <span className="electronics-choice-row">
          <Chip selected={mode === 'charge'} onClick={() => setMode('charge')}>
            Charge
          </Chip>
          <Chip selected={mode === 'leak'} onClick={() => setMode('leak')}>
            Leak
          </Chip>
        </span>
      </Field>
      <Field label="EMF" value={`${V} V`}>
        <Slider value={V} min={1} max={12} step={1} onChange={setV} ariaLabel="EMF (volts)" />
      </Field>
      <Field label="R" value={`${R} kΩ`}>
        <Slider
          value={R}
          min={1}
          max={100}
          step={1}
          onChange={setR}
          ariaLabel="charging resistance (kilohm)"
        />
      </Field>
      <Field label="C" value={`${C} µF`}>
        <Slider
          value={C}
          min={10}
          max={1000}
          step={10}
          onChange={setC}
          ariaLabel="capacitance (microfarad)"
        />
      </Field>
      <Field label="leak R" value={`${leak} kΩ`}>
        <Slider
          value={leak}
          min={20}
          max={1000}
          step={10}
          onChange={setLeak}
          ariaLabel="leakage resistance (kilohm)"
        />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Capacitors and transients"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode}</span>
          <span>Vc {vc.toFixed(2)} V</span>
          <span>τ {tau.toFixed(2)} s</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="The voltage changes exponentially because the driving voltage difference shrinks as the capacitor approaches its target. One time constant covers about 63% of the remaining gap."
      transcript={
        <p>
          The capacitor is {Math.round(q * 100)} percent charged at {vc.toFixed(2)} volts in {mode} mode. The
          active time constant is {tau.toFixed(2)} seconds.
        </p>
      }
      support={<HintLadder hints={hint} />}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="discharged"
            met={solved}
            complete={complete}
            outcome={`${Math.round(q * 100)}% remaining`}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
