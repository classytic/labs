'use client';

/**
 * TerminalVelocityLab, "The skydiver", why falling things stop speeding up.
 *
 * A real fall isn't free fall: air pushes back with a drag that grows with speed
 * (∝ v²). Gravity (mg, constant) wins at first, but as v rises the drag catches
 * up until the two BALANCE, net force zero, acceleration zero, and the speed
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
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Stage, Segment, Polyline, Label, type Vec2 } from '@classytic/stage';
import { usePlayGate } from '../../kit/play.js';
import { Slider, Chip } from '../../kit/controls.js';
import { Field, Control, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';
import { MechanicsActivity } from '../mechanics/activity.js';
import { MechanicsVector, SceneSurface, SimulationTransport } from '../mechanics/presentation.js';
import { terminalVelocityState } from '../mechanics/core.js';

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
    explain: 'Drag balances weight, so net force is zero, the speed is constant, not the position.',
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
  activity?: string | AuthoredActivity;
  /** Lock/hide knobs, e.g. `{ hide: ['parachute'] }`. */
  controlConfig?: ControlConfig;
}

const G = 9.8;
const WIN = 14; // s of v–t graph
const VMAX = 65; // m/s, fixed graph axis
const CHUTE = 70; // parachute multiplies the drag factor

export function TerminalVelocityLab({
  mass = 80,
  drag = 0.4,
  parachute = false,
  title = 'The skydiver: why you stop speeding up',
  prompt = 'Air drag grows with speed until it balances gravity; then the net force is zero and the speed levels off at the terminal velocity v_t = √(mg/b). Watch the drag arrow rise to meet the weight, and the v–t curve flatten. Pop the parachute to crash v_t.',
  objectives,
  controlConfig,
  activity,
}: TerminalVelocityProps): ReactNode {
  const [m, setM] = useState(mass);
  const [d, setD] = useState(drag);
  const [chute, setChute] = useState(parachute);
  const gate = usePlayGate();

  const challenge = useChallenge(TERMINAL_CHALLENGE);
  useCheckpoint({
    solved: challenge.allCorrect,
    activity: 'terminal-velocity',
  });

  const tRef = useRef(0);

  const b = d * (chute ? CHUTE : 1);
  const terminal = terminalVelocityState(m, G, b, tRef.current);
  const vt = terminal.terminalSpeed;
  const tau = terminal.timeConstant;

  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
    if (tRef.current > WIN + 2) tRef.current = 0; // loop the drop
  });

  const t = tRef.current;
  const v = terminal.speed;
  const dragFrac = terminal.dragRatio;
  const fallDist = terminal.distance;

  // ---- falling-body scene (body fixed; background scrolls up to show motion) ----
  const WLEN = 1.5; // weight arrow length (world)
  const scroll = (fallDist * 0.25) % 1.6; // marker scroll offset
  const marks: number[] = [];
  for (let i = -1; i <= 4; i++) marks.push(2.2 - i * 1.6 + scroll);
  const scene = (
    <Stage
      view={{ xMin: -3, xMax: 3, yMin: -2.6, yMax: 2.6 }}
      height={180}
      preserveAspect={false}
      ariaLabel={`Skydiver falling at ${v.toFixed(0)} m/s of terminal ${vt.toFixed(0)}`}
    >
      {/* scrolling air markers (motion cue) */}
      {marks.map((y, i) =>
        y > -2.4 && y < 2.4 ? (
          <Segment
            key={i}
            from={{ x: -2.7, y }}
            to={{ x: -2.1, y }}
            color="var(--stage-muted)"
            opacity={0.5}
            weight={2}
          />
        ) : null,
      )}
      {marks.map((y, i) =>
        y > -2.4 && y < 2.4 ? (
          <Segment
            key={`r${i}`}
            from={{ x: 2.1, y }}
            to={{ x: 2.7, y }}
            color="var(--stage-muted)"
            opacity={0.5}
            weight={2}
          />
        ) : null,
      )}
      {/* body */}
      <Label x={0} y={0.1} text={chute ? '🪂' : '🧍'} color="var(--stage-fg)" size={chute ? 40 : 32} />
      {/* weight (constant, down) */}
      <MechanicsVector
        tail={{ x: -0.9, y: 0 }}
        tip={{ x: -0.9, y: -WLEN }}
        color="var(--stage-fg)"
        label="weight mg"
        labelDy={14}
        weight={3}
        labelSize={11}
      />
      {/* drag (grows, up) */}
      {dragFrac > 0.01 && (
        <MechanicsVector
          tail={{ x: 0.9, y: 0 }}
          tip={{ x: 0.9, y: WLEN * dragFrac }}
          color="var(--stage-warn)"
          weight={3}
          label="drag ∝ v²"
          labelDy={-6}
          labelSize={11}
          active={dragFrac > 0.92}
        />
      )}
    </Stage>
  );

  // ---- v–t graph ----
  const curve: Vec2[] = [];
  for (let i = 0; i <= 120; i++) {
    const tau2 = (i / 120) * WIN;
    curve.push({ x: tau2, y: vt * Math.tanh(tau2 / tau) });
  }
  const graph = (
    <Stage
      view={{ xMin: 0, xMax: WIN, yMin: 0, yMax: VMAX }}
      height={150}
      preserveAspect={false}
      ariaLabel={`Speed versus time approaching terminal velocity ${vt.toFixed(0)} m/s`}
    >
      <Segment
        from={{ x: 0, y: 0 }}
        to={{ x: WIN, y: 0 }}
        color="var(--stage-fg)"
        opacity={0.5}
        weight={1.5}
      />
      <Segment
        from={{ x: 0, y: 0 }}
        to={{ x: 0, y: VMAX }}
        color="var(--stage-fg)"
        opacity={0.5}
        weight={1.5}
      />
      <Label x={0} y={VMAX} text="speed (m/s)" color="var(--stage-fg)" size={10} anchor="start" dy={-2} />
      <Label x={WIN} y={0} text="time →" color="var(--stage-fg)" size={10} anchor="end" dy={14} />
      {/* terminal asymptote */}
      <Segment
        from={{ x: 0, y: vt }}
        to={{ x: WIN, y: vt }}
        color="var(--stage-good)"
        opacity={0.7}
        weight={1.2}
        dashed
      />
      <Label
        x={WIN}
        y={vt}
        text={`v_t ${vt.toFixed(0)}`}
        color="var(--stage-good)"
        size={10}
        anchor="end"
        dy={-3}
      />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      <Polyline
        points={[
          { x: clamp(t, 0, WIN), y: 0 },
          { x: clamp(t, 0, WIN), y: v },
        ]}
        color="var(--stage-accent)"
        opacity={0.5}
        weight={1}
        dashed
      />
      <Label
        x={clamp(t, 0, WIN)}
        y={v}
        text={`${v.toFixed(0)}`}
        color="var(--stage-accent)"
        size={11}
        dy={-4}
      />
    </Stage>
  );

  const figure = (
    <div ref={gate.ref} className="physics-visual-stack">
      <SceneSurface>{scene}</SceneSurface>
      <div className="physics-trace-card">{graph}</div>
    </div>
  );

  const aside = (
    <>
      <div className="physics-dynamics-ledger">
        <div>
          <span>Terminal speed · √(mg/b)</span>
          <strong>{vt.toFixed(0)} m/s</strong>
        </div>
        <div data-highlight>
          <span>Speed now</span>
          <strong>
            {v.toFixed(0)} m/s · {Math.round((v / vt) * 100)}%
          </strong>
        </div>
        <div>
          <span>Drag / weight</span>
          <strong>{Math.round(dragFrac * 100)}%</strong>
        </div>
      </div>
      <p className="physics-explain">
        At v_t the drag exactly cancels the weight, zero net force, zero acceleration, constant speed. A
        parachute multiplies the drag, so v_t drops from a deadly ~{Math.round(Math.sqrt((m * G) / d))} m/s to
        a soft landing.
      </p>
      <LiveRegion>{`Falling at ${v.toFixed(0)} of terminal ${vt.toFixed(
        0,
      )} metres per second; drag is ${Math.round(dragFrac * 100)} percent of weight.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <Control name="parachute">
        <Chip selected={chute} onClick={() => setChute((c) => !c)}>
          parachute {chute ? '🪂 open' : 'closed'}
        </Chip>
      </Control>
      <Field label="mass" value={`${m} kg`}>
        <Slider value={m} min={40} max={120} step={5} onChange={setM} ariaLabel="mass (kg)" />
      </Field>
      <Field label="air drag" value={d.toFixed(1)}>
        <Slider value={d} min={0.2} max={1.2} step={0.1} onChange={setD} ariaLabel="drag factor" />
      </Field>
    </>
  );

  const reset = (): void => {
    gate.setPlaying(false);
    tRef.current = 0;
  };
  const transport = (
    <SimulationTransport
      running={gate.playing}
      onReset={reset}
      onToggle={() => gate.setPlaying(!gate.playing)}
      state={gate.playing ? 'Falling' : 'Paused'}
      detail={`${Math.round((v / vt) * 100)}% of terminal speed`}
      startLabel="Drop"
      resetLabel="Reset fall"
    />
  );
  return (
    <MechanicsActivity
      activity={activity}
      className="physics-terminal-velocity"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{dragFrac > 0.98 ? 'Forces balanced' : 'Accelerating downward'}</strong>
          <span>v {v.toFixed(0)} m/s</span>
          <span>vₜ {vt.toFixed(0)} m/s</span>
          <span>a {terminal.acceleration.toFixed(1)} m/s²</span>
        </>
      }
      figure={figure}
      instruments={aside}
      controls={controls}
      feedback={
        dragFrac > 0.98
          ? 'Drag now matches weight: net force and acceleration approach zero while the diver keeps moving.'
          : `Drag is ${Math.round(dragFrac * 100)}% of weight and grows with speed squared.`
      }
      objectives={objectives}
      transport={transport}
      footer={<ChallengeCard questions={TERMINAL_CHALLENGE} state={challenge} title="Predict" />}
      controlConfig={controlConfig}
      canvasLabel="Terminal-velocity force and speed experiment"
      inspectorLabel="Forces, speed, and drag controls"
    />
  );
}
