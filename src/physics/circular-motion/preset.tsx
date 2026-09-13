'use client';

/**
 * CircularMotionLab, "Whirl & cut", where centripetal force points and where the
 * ball REALLY goes when you let go.
 *
 * A ball on a string whirls at constant speed. The velocity arrow is always
 * TANGENT; the tension (centripetal force F = mv²/r) always points to the centre ,
 * it changes the direction of v, never its size. Then CUT THE STRING: the ball
 * flies off along the tangent in a straight line, NOT radially outward, the
 * single most common misconception. Tune v, r, m and read F live (hammer throw,
 * a car cornering, the spin cycle).
 *
 * Uses the ambient PlayWrap gate (pause to study the vectors). Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Stage, Circle, Segment, Polyline, Dot } from '@classytic/stage';
import { usePlayGate } from '../../kit/play.js';
import { ActionButton, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';
import { MechanicsActivity } from '../mechanics/activity.js';
import { MechanicsVector, SceneSurface, SimulationTransport } from '../mechanics/presentation.js';
import { circularMotionState } from '../mechanics/core.js';

const PREDICT: ChallengeQuestion[] = [
  {
    id: 'release',
    prompt:
      'You’re whirling a ball on a string in a circle. At the instant you let go, which way does the ball fly?',
    choices: [
      {
        value: 'tangent',
        label: 'straight, along the tangent (the way it was moving)',
      },
      { value: 'radial', label: 'straight outward, away from the centre' },
      { value: 'curve', label: 'it keeps curving for a bit' },
    ],
    answer: 'tangent',
    explain:
      'No force acts after release, so by Newton’s first law it travels in a straight line along its velocity, the tangent. It does NOT fly radially outward (that’s the common misconception) and does not keep curving.',
  },
];

export interface CircularMotionProps {
  speed?: number;
  radius?: number;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
  /** Lock/hide knobs, e.g. `{ lock: ['radius'] }`. */
  controlConfig?: ControlConfig;
}

export function CircularMotionLab({
  speed = 6,
  radius = 3,
  mass = 1,
  title = 'Whirl & cut: where does it really go?',
  prompt = 'The string’s tension is the centripetal force F = mv²/r, always toward the centre, bending the path without changing the speed. Cut the string and the ball leaves along the tangent, not outward.',
  objectives,
  controlConfig,
  activity,
}: CircularMotionProps): ReactNode {
  const [v, setV] = useState(speed);
  const [r, setR] = useState(radius);
  const [m, setM] = useState(mass);
  const [cut, setCut] = useState(false);
  const gate = usePlayGate();
  const ch = useChallenge(PREDICT);
  useCheckpoint({ solved: ch.allCorrect, activity: 'circular-motion-predict' });

  const ang = useRef(0); // current angle (CCW)
  const fly = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const motion = circularMotionState(m, v, r);
  const omega = motion.angularSpeed;
  const F = motion.centripetalForce;

  useFrameTick(gate.running, (f) => {
    const dt = Math.min(0.04, f.dtMs / 1000);
    if (!cut) {
      ang.current = (ang.current + omega * dt) % (Math.PI * 2);
    } else if (fly.current) {
      fly.current.x += fly.current.vx * dt;
      fly.current.y += fly.current.vy * dt;
      // it has flown clear in a straight line, stop (re-tie to run again) instead of teleporting back
      if (Math.hypot(fly.current.x, fly.current.y) > 8.5) gate.setPlaying(false);
    }
  });

  const ballPos = (): { x: number; y: number } => ({
    x: r * Math.cos(ang.current),
    y: r * Math.sin(ang.current),
  });
  const tangent = (): { x: number; y: number } => ({
    x: -Math.sin(ang.current),
    y: Math.cos(ang.current),
  }); // CCW unit tangent

  function startFly(): void {
    const p = ballPos();
    const tg = tangent();
    fly.current = { x: p.x, y: p.y, vx: tg.x * v, vy: tg.y * v };
  }
  const doCut = (): void => {
    startFly();
    setCut(true);
    gate.setPlaying(true);
  };
  const retie = (): void => {
    setCut(false);
    fly.current = null;
  };
  const onParam =
    (set: (n: number) => void) =>
    (n: number): void => {
      set(n);
      retie();
    };

  const VSCALE = 0.45; // m/s → world length for the velocity arrow
  const FSCALE = 0.1; // N → world length for the force arrow

  const p = cut && fly.current ? { x: fly.current.x, y: fly.current.y } : ballPos();
  const tg = tangent();
  const orbitTrail = Array.from({ length: 22 }, (_, index) => {
    const theta = ang.current - (index / 21) * Math.PI * 0.72;
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  }).reverse();
  const span = Math.max(6, r + 3);
  const view = { xMin: -span, xMax: span, yMin: -span, yMax: span };

  const radial = { x: Math.cos(ang.current), y: Math.sin(ang.current) };
  const forceLength = clamp(F * FSCALE, 0.85, Math.max(1.1, r * 0.72));

  const figure = (
    <SceneSurface ref={gate.ref} tone="grid">
      <Stage
        view={view}
        height={300}
        preserveAspect
        ariaLabel={`Ball whirling at ${v} m/s on a ${r} m string, centripetal force ${F.toFixed(
          0,
        )} newtons${cut ? '; string cut, flying off tangentially' : ''}`}
      >
        {/* circular path */}
        <Circle
          center={{ x: 0, y: 0 }}
          r={r}
          color="var(--stage-fg)"
          opacity={0.3}
          weight={1.2}
          fill="none"
        />
        {!cut ? (
          <Polyline points={orbitTrail} color="var(--stage-accent)" opacity={0.5} weight={3.2} />
        ) : null}
        {/* anchored hub makes the apparatus read as a tether, not an abstract graph */}
        <Circle
          center={{ x: 0, y: 0 }}
          r={0.34}
          color="var(--stage-fg)"
          fill="var(--stage-bg)"
          fillOpacity={1}
          weight={2}
        />
        <Dot x={0} y={0} r={4} color="var(--stage-fg)" opacity={0.82} />
        {/* string + centripetal force (only while attached) */}
        {!cut && <Segment from={{ x: 0, y: 0 }} to={p} color="var(--stage-fg)" opacity={0.5} weight={1.5} />}
        {!cut && (
          <MechanicsVector
            tail={p}
            tip={{
              x: p.x - radial.x * forceLength,
              y: p.y - radial.y * forceLength,
            }}
            color="var(--stage-warn)"
            active={gate.running}
          />
        )}
        {/* velocity is attached to the moving body and remains tangent after release */}
        <MechanicsVector
          tail={p}
          tip={{ x: p.x + tg.x * v * VSCALE, y: p.y + tg.y * v * VSCALE }}
          color="var(--stage-good)"
          active={gate.running}
        />
        {/* faint tangent guide line after the cut, proves "tangent, not outward" */}
        {cut && fly.current && (
          <Segment
            from={{
              x: fly.current.x - tg.x * 12,
              y: fly.current.y - tg.y * 12,
            }}
            to={{ x: fly.current.x + tg.x * 12, y: fly.current.y + tg.y * 12 }}
            color="var(--stage-good)"
            opacity={0.3}
            weight={1}
            dashed
          />
        )}
        {/* the ball */}
        <Circle
          center={p}
          r={0.45}
          color="var(--stage-accent)"
          fill="var(--stage-accent)"
          fillOpacity={0.9}
          weight={1.5}
        />
        <Circle
          center={p}
          r={0.18}
          color="var(--stage-bg)"
          fill="var(--stage-bg)"
          fillOpacity={0.9}
          weight={0}
        />
      </Stage>
    </SceneSurface>
  );

  const aside = (
    <>
      <div className="physics-orbital-ledger">
        <div data-highlight>
          <span>Centripetal force · mv²/r</span>
          <strong>{F.toFixed(0)} N</strong>
        </div>
        <div>
          <span>Angular speed · v/r</span>
          <strong>{omega.toFixed(2)} rad/s</strong>
        </div>
        <div>
          <span>Period · 2πr/v</span>
          <strong>{motion.period.toFixed(2)} s</strong>
        </div>
      </div>
      <p className="physics-explain">
        <span className="physics-vector-velocity">Green: velocity is tangent.</span>{' '}
        <span className="physics-vector-force-secondary">Amber: force points to the centre.</span> Cut the
        string → no inward pull → straight-line tangent flight (Newton’s 1st law). Hammer throw, a car
        cornering, the spin cycle.
      </p>
      <LiveRegion>
        {cut
          ? 'String cut, the ball travels in a straight line along the tangent.'
          : `Centripetal force ${F.toFixed(0)} newtons toward the centre.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <>
      <Field label="speed v" value={`${v} m/s`}>
        <Slider value={v} min={2} max={12} step={0.5} onChange={onParam(setV)} ariaLabel="speed (m/s)" />
      </Field>
      <Field label="radius r" value={`${r} m`}>
        <Slider
          value={r}
          min={1.5}
          max={5}
          step={0.5}
          onChange={onParam((n) => setR(clamp(n, 1.5, 5)))}
          ariaLabel="radius (m)"
        />
      </Field>
      <Field label="mass m" value={`${m} kg`}>
        <Slider value={m} min={0.5} max={4} step={0.5} onChange={onParam(setM)} ariaLabel="mass (kg)" />
      </Field>
    </>
  );

  const footer = <ChallengeCard questions={PREDICT} state={ch} title="Predict first" />;

  const reset = (): void => {
    gate.setPlaying(false);
    ang.current = 0;
    retie();
  };
  const transport = (
    <SimulationTransport
      running={gate.playing}
      onReset={reset}
      onToggle={() => gate.setPlaying(!gate.playing)}
      state={cut ? 'Free flight' : 'Tethered'}
      detail={cut ? 'moving along the tangent' : 'inward force active'}
      renderAction={(playAction) => (
        <div className="physics-transport-actions">
          <ActionButton className="lab-btn-ghost physics-cut-button" onClick={cut ? retie : doCut}>
            {cut ? 'Re-tie string' : 'Release string'}
          </ActionButton>
          {playAction}
        </div>
      )}
      resetLabel="Reset circular motion"
    />
  );
  return (
    <MechanicsActivity
      activity={activity}
      className="physics-circular-motion"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{cut ? 'Free tangent flight' : 'Centripetal motion'}</strong>
          <span>F {F.toFixed(0)} N</span>
          <span>ω {omega.toFixed(2)} rad/s</span>
        </>
      }
      figure={figure}
      instruments={aside}
      controls={controls}
      feedback={
        cut
          ? 'With the inward force removed, the ball continues along its instantaneous tangent.'
          : 'Velocity is tangent while the net force points inward, changing direction but not speed.'
      }
      objectives={objectives}
      transport={transport}
      footer={footer}
      controlConfig={controlConfig}
      canvasLabel="Circular motion and tangent-release experiment"
    />
  );
}
