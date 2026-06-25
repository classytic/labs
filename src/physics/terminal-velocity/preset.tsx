'use client';

/**
 * TerminalVelocityLab — "The skydiver", why falling things stop speeding up.
 *
 * A real fall isn't free fall: air pushes back with a drag that grows with speed
 * (∝ v²). Gravity (mg, constant) wins at first, but as v rises the drag catches
 * up until the two BALANCE — net force zero, acceleration zero, and the speed
 * levels off at the terminal velocity:
 *
 *     m·dv/dt = mg − b·v²        ⟹        v(t) = v_t·tanh(g·t / v_t),   v_t = √(mg/b)
 *
 * The weight arrow stays fixed while the drag arrow grows to meet it; the v–t
 * curve flattens onto its asymptote. Pop the parachute (huge b) and v_t collapses
 * to a survivable speed.
 *
 * Ambient PlayWrap gate. Analytic (exact tanh solution) → no drift. Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Vector, Label, type Vec2 } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, Control, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

const TERMINAL_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'accel',
    prompt: 'At terminal velocity the acceleration is…',
    choices: [
      { value: 'zero', label: 'zero' },
      { value: 'g', label: 'still g (9.8 m/s²)' },
      { value: 'max', label: 'at its maximum' },
    ],
    answer: 'zero',
    explain: 'Drag balances weight, so net force is zero — the speed is constant, not the position.',
  },
  {
    id: 'when',
    prompt: 'Terminal velocity happens when air resistance…',
    choices: [
      { value: 'equals', label: 'equals the weight' },
      { value: 'zero', label: 'drops to zero' },
      { value: 'exceeds', label: 'exceeds the weight' },
    ],
    answer: 'equals',
    explain: 'Drag grows with v² until it matches mg; then the forces cancel and v levels off.',
  },
];

export interface TerminalVelocityProps {
  mass?: number;
  /** Air-drag factor (streamlining/area), arbitrary units. */
  drag?: number;
  parachute?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['parachute'] }`. */
  controlConfig?: ControlConfig;
}

const G = 9.8;
const WIN = 14;        // s of v–t graph
const VMAX = 65;       // m/s, fixed graph axis
const CHUTE = 70;      // parachute multiplies the drag factor

export function TerminalVelocityLab({
  mass = 80, drag = 0.4, parachute = false,
  title = 'The skydiver — why you stop speeding up',
  prompt = 'Air drag grows with speed until it balances gravity; then the net force is zero and the speed levels off at the terminal velocity v_t = √(mg/b). Watch the drag arrow rise to meet the weight, and the v–t curve flatten. Pop the parachute to crash v_t.',
  objectives,
  controlConfig,
}: TerminalVelocityProps): ReactNode {
  const [m, setM] = useState(mass);
  const [d, setD] = useState(drag);
  const [chute, setChute] = useState(parachute);
  const gate = usePlayGate();

  const challenge = useChallenge(TERMINAL_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'terminal-velocity' });

  const tRef = useRef(0);

  const b = d * (chute ? CHUTE : 1);
  const vt = Math.sqrt((m * G) / b);
  const tau = vt / G;                         // time constant

  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
    if (tRef.current > WIN + 2) tRef.current = 0;    // loop the drop
  });

  const t = tRef.current;
  const v = vt * Math.tanh(t / tau);
  const dragFrac = (v / vt) * (v / vt);        // drag / weight
  const fallDist = (vt * vt / G) * Math.log(Math.cosh(t / tau));

  // ---- falling-body scene (body fixed; background scrolls up to show motion) ----
  const WLEN = 1.5;                            // weight arrow length (world)
  const scroll = (fallDist * 0.25) % 1.6;      // marker scroll offset
  const marks: number[] = [];
  for (let i = -1; i <= 4; i++) marks.push(2.2 - i * 1.6 + scroll);
  const scene = (
    <Stage view={{ xMin: -3, xMax: 3, yMin: -2.6, yMax: 2.6 }} height={180} preserveAspect={false} ariaLabel={`Skydiver falling at ${v.toFixed(0)} m/s of terminal ${vt.toFixed(0)}`}>
      {/* scrolling air markers (motion cue) */}
      {marks.map((y, i) => (y > -2.4 && y < 2.4 ? <Segment key={i} from={{ x: -2.7, y }} to={{ x: -2.1, y }} color="var(--stage-muted)" opacity={0.5} weight={2} /> : null))}
      {marks.map((y, i) => (y > -2.4 && y < 2.4 ? <Segment key={`r${i}`} from={{ x: 2.1, y }} to={{ x: 2.7, y }} color="var(--stage-muted)" opacity={0.5} weight={2} /> : null))}
      {/* body */}
      <Label x={0} y={0.1} text={chute ? '🪂' : '🧍'} color="var(--stage-fg)" size={chute ? 40 : 32} />
      {/* weight (constant, down) */}
      <Vector tail={{ x: -0.9, y: 0 }} tip={{ x: -0.9, y: -WLEN }} color="var(--stage-fg)" weight={3} />
      <Label x={-0.9} y={-WLEN} text="mg" color="var(--stage-fg)" size={11} dy={14} />
      {/* drag (grows, up) */}
      {dragFrac > 0.01 && <Vector tail={{ x: 0.9, y: 0 }} tip={{ x: 0.9, y: WLEN * dragFrac }} color="var(--stage-warn)" weight={3} />}
      <Label x={0.9} y={WLEN * Math.max(dragFrac, 0.12)} text="drag ∝ v²" color="var(--stage-warn)" size={11} dy={-6} />
    </Stage>
  );

  // ---- v–t graph ----
  const curve: Vec2[] = [];
  for (let i = 0; i <= 120; i++) { const tau2 = (i / 120) * WIN; curve.push({ x: tau2, y: vt * Math.tanh(tau2 / tau) }); }
  const graph = (
    <Stage view={{ xMin: 0, xMax: WIN, yMin: 0, yMax: VMAX }} height={150} preserveAspect={false} ariaLabel={`Speed versus time approaching terminal velocity ${vt.toFixed(0)} m/s`}>
      <Segment from={{ x: 0, y: 0 }} to={{ x: WIN, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
      <Segment from={{ x: 0, y: 0 }} to={{ x: 0, y: VMAX }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
      <Label x={0} y={VMAX} text="speed (m/s)" color="var(--stage-fg)" size={10} anchor="start" dy={-2} />
      <Label x={WIN} y={0} text="time →" color="var(--stage-fg)" size={10} anchor="end" dy={14} />
      {/* terminal asymptote */}
      <Segment from={{ x: 0, y: vt }} to={{ x: WIN, y: vt }} color="var(--stage-good)" opacity={0.7} weight={1.2} dashed />
      <Label x={WIN} y={vt} text={`v_t ${vt.toFixed(0)}`} color="var(--stage-good)" size={10} anchor="end" dy={-3} />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      <Polyline points={[{ x: clamp(t, 0, WIN), y: 0 }, { x: clamp(t, 0, WIN), y: v }]} color="var(--stage-accent)" opacity={0.5} weight={1} dashed />
      <Label x={clamp(t, 0, WIN)} y={v} text={`${v.toFixed(0)}`} color="var(--stage-accent)" size={11} dy={-4} />
    </Stage>
  );

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ display: 'grid', gap: 8 }}>
        {scene}
        {graph}
      </div>
    </PlayWrap>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>terminal v_t = √(mg/b) = <strong>{vt.toFixed(0)} m/s</strong></span>
          <span>speed now = <strong>{v.toFixed(0)} m/s</strong> ({Math.round((v / vt) * 100)}% of v_t)</span>
          <span>drag = <strong>{Math.round(dragFrac * 100)}%</strong> of weight</span>
        </span>
      </Callout>
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        At v_t the drag exactly cancels the weight — zero net force, zero acceleration, constant speed.
        A parachute multiplies the drag, so v_t drops from a deadly ~{Math.round(Math.sqrt((m * G) / d))} m/s to a soft landing.
      </p>
      <LiveRegion>{`Falling at ${v.toFixed(0)} of terminal ${vt.toFixed(0)} metres per second; drag is ${Math.round(dragFrac * 100)} percent of weight.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <Control name="parachute"><Chip selected={chute} onClick={() => setChute((c) => !c)}>parachute {chute ? '🪂 open' : 'closed'}</Chip></Control>
      <Field label="mass" value={`${m} kg`}><Slider value={m} min={40} max={120} step={5} onChange={setM} ariaLabel="mass (kg)" /></Field>
      <Field label="air drag" value={d.toFixed(1)}><Slider value={d} min={0.2} max={1.2} step={0.1} onChange={setD} ariaLabel="drag factor" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig} footer={<ChallengeCard questions={TERMINAL_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
