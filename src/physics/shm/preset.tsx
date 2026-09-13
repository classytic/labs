'use client';

/**
 * SimpleHarmonicLab, "The same swing", where a spring and a pendulum turn out to
 * be the SAME motion, and where a wave comes from.
 *
 * One SHM kernel, two skins. A restoring force pulls back in proportion to the
 * displacement (spring: F = −kx; pendulum, small angle: F ≈ −mg·x/L), which forces
 * a = −ω²x and the solution x(t) = A·cos(ωt). The mass oscillates while a pen
 * traces x against time, and the trace IS a sine curve, the very shape of the
 * waves lessons (a wave is SHM spread through space). Energy sloshes between
 * elastic/PE and KE, summing to a constant (ties to the energy-skate lab).
 *
 *   ω = √(k/m)  (spring)        T = 2π√(m/k)     , heavier or softer ⇒ slower
 *   ω = √(g/L)  (pendulum)      T = 2π√(L/g)     , independent of mass AND amplitude
 *
 * Ambient PlayWrap gate (pause to read the force arrow). Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Polygon, Circle, Dot, Label, type Vec2 } from '@classytic/stage';
import { usePlayGate } from '../../kit/play.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, Control, MeterBar, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';
import { springOmega, smallAnglePendulumOmega, oscillatorPeriod, sampleOscillator } from './core.js';
import { SceneSurface, SimulationTransport, TracePanel } from '../mechanics/presentation.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

export type SHMMode = 'spring' | 'pendulum';

const SHM_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Connect oscillation, energy, and waves',
  objectives: [
    'Locate maximum speed and stored energy',
    'Relate system parameters to period',
    'Connect a displacement-time trace to a wave',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the fastest point',
      lead: 'Decide where the oscillator moves fastest before playing it.',
      success: 'fastest-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run one oscillation',
      lead: 'Track displacement and the energy exchange.',
      controls: true,
      reveal: ['model'],
      success: 'played',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the trace',
      lead: 'Compare the moving object with its displacement-time trace.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the rhythm',
      lead: 'Use the restoring force and energy exchange to explain the repeating motion.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the oscillator',
      lead: 'Switch representation or change a parameter and compare the period.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'model-changed',
    },
  ],
  questions: [
    {
      id: 'fastest',
      prompt: 'In simple harmonic motion, where is speed greatest?',
      choices: [
        { value: 'centre', label: 'At the centre (equilibrium)' },
        { value: 'extreme', label: 'At either extreme' },
        { value: 'even', label: 'It is the same everywhere' },
      ],
      answer: 'centre',
      explain: 'Stored energy is lowest and kinetic energy is greatest at equilibrium.',
    },
  ],
  success: [
    {
      id: 'fastest-answer',
      source: 'answer',
      key: 'fastest',
      operator: 'eq',
      value: 'centre',
      pendingLabel: 'Choose where speed is greatest.',
    },
    {
      id: 'played',
      source: 'metric',
      key: 'played',
      operator: 'eq',
      value: true,
      pendingLabel: 'Play the oscillator.',
    },
    {
      id: 'model-changed',
      source: 'metric',
      key: 'modelChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch oscillator or change a parameter.',
    },
  ],
};

export interface SimpleHarmonicProps {
  mode?: SHMMode;
  /** Spring stiffness k (N/m). */
  k?: number;
  /** Pendulum length L (m). */
  length?: number;
  mass?: number;
  /** Amplitude: metres (spring) or degrees (pendulum). */
  amplitude?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Focus a lesson: set `mode` + `controlConfig:{ hide:['mode'] }` for spring-only or pendulum-only. */
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}

const G = 9.8;
const WIN = 6; // seconds of trace shown

function CompactVector({ tail, tip, color }: { tail: Vec2; tip: Vec2; color: string }): ReactNode {
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const head = Math.min(0.22, length * 0.32);
  const wing = head * 0.55;
  const neck = { x: tip.x - ux * head, y: tip.y - uy * head };
  return (
    <>
      <Segment from={tail} to={neck} color={color} weight={2.2} />
      <Polygon
        points={[
          tip,
          { x: neck.x - uy * wing, y: neck.y + ux * wing },
          { x: neck.x + uy * wing, y: neck.y - ux * wing },
        ]}
        color={color}
        fill={color}
        fillOpacity={1}
        weight={1}
      />
    </>
  );
}

export function SimpleHarmonicLab({
  mode = 'spring',
  k = 8,
  length = 2,
  mass = 1,
  amplitude,
  title = 'The same swing: spring, pendulum, and where a wave comes from',
  prompt = 'A restoring force pulls back in proportion to displacement, so a = −ω²x and the motion is x(t) = A·cos(ωt). Watch the pen trace a sine, that’s the shape of a wave. Swap to a pendulum: its period ignores both mass and amplitude.',
  objectives,
  controlConfig,
  activity = 'shm',
}: SimpleHarmonicProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'shm';
  const authoredActivity = typeof activity === 'string' ? SHM_ACTIVITY : activity;
  const [md, setMd] = useState<SHMMode>(mode);
  const [kk, setKk] = useState(k);
  const [L, setL] = useState(length);
  const [m, setM] = useState(mass);
  const isSpring = md === 'spring';
  const [ampM, setAmpM] = useState(amplitude ?? 2.4); // spring amplitude (m)
  const [ampDeg, setAmpDeg] = useState(Math.min(amplitude ?? 10, 12)); // ideal small-angle pendulum

  const gate = usePlayGate();
  const tRef = useRef(0);
  const [, paint] = useState(0);

  const omega = isSpring ? springOmega(kk, m) : smallAnglePendulumOmega(L, G);
  const T = oscillatorPeriod(omega);
  const f = 1 / T;

  useFrameTick(gate.running, (fr) => {
    tRef.current += Math.min(0.05, fr.dtMs / 1000);
    paint((n) => (n + 1) % 100000);
  });

  const t = tRef.current;
  const sample = sampleOscillator(1, omega, t);
  const u = sample.displacement;
  // energy split (fractions): PE ∝ u², KE ∝ (1−u²)
  const peFrac = sample.potentialFraction;
  const keFrac = sample.kineticFraction;

  // ---- oscillator scene ----
  const scene = isSpring
    ? (() => {
        const wallX = -6.2,
          eqX = 0.4;
        const x = eqX + ampM * u; // mass centre
        const half = 0.7;
        const massLeft = x - half;
        // ---- a real coil spring (helix): y = sin (the coil), a small cos in x gives each loop its
        //      3D roundness. Fixed coil count over a variable body ⇒ it visibly compresses/stretches. ----
        const coils = 9;
        const rad = 0.62; // coil radius (vertical)
        const wob = 0.14; // horizontal roundness of each loop
        const lead = 0.34; // straight lead wire at each end
        const bodyStart = wallX + lead;
        const bodyEnd = massLeft - lead;
        const bodyLen = Math.max(0.6, bodyEnd - bodyStart);
        const N = coils * 20;
        const coil: Vec2[] = [
          { x: wallX, y: 0 },
          { x: bodyStart, y: 0 },
        ];
        for (let i = 1; i <= N; i++) {
          const s = i / N;
          const ang = s * coils * Math.PI * 2;
          coil.push({ x: bodyStart + s * bodyLen + wob * Math.cos(ang), y: rad * Math.sin(ang) });
        }
        coil.push({ x: bodyEnd, y: 0 }, { x: massLeft, y: 0 });
        const Fx = -kk * ampM * u; // restoring force (N), toward eq
        return (
          <Stage
            view={{ xMin: -7, xMax: 7, yMin: -2.4, yMax: 2.4 }}
            height={170}
            preserveAspect={false}
            ariaLabel={`Mass on a spring oscillating, displacement ${(ampM * u).toFixed(2)} m`}
          >
            <Segment
              from={{ x: -7, y: -1.4 }}
              to={{ x: 7, y: -1.4 }}
              color="var(--stage-fg)"
              opacity={0.35}
              weight={1.2}
            />
            {/* wall (hatched anchor) */}
            <Segment
              from={{ x: wallX, y: -1.4 }}
              to={{ x: wallX, y: 1.4 }}
              color="var(--stage-fg)"
              opacity={0.7}
              weight={3}
            />
            {/* equilibrium marker */}
            <Polygon
              points={[
                { x: eqX - 0.16, y: -1.15 },
                { x: eqX + 0.16, y: -1.15 },
                { x: eqX + 0.16, y: 1.15 },
                { x: eqX - 0.16, y: 1.15 },
              ]}
              color="var(--stage-good)"
              fill="var(--stage-good)"
              fillOpacity={0.08}
              opacity={0}
            />
            <Segment
              from={{ x: eqX, y: -1.2 }}
              to={{ x: eqX, y: 1.2 }}
              color="var(--stage-muted)"
              opacity={0.6}
              weight={1}
              dashed
            />
            <Label x={eqX} y={-1.2} text="equilibrium · x = 0" color="var(--stage-good)" size={10} dy={14} />
            <Segment
              from={{ x: eqX - ampM, y: -1.05 }}
              to={{ x: eqX + ampM, y: -1.05 }}
              color="var(--stage-accent)"
              opacity={0.35}
              weight={1.5}
            />
            <Dot x={eqX - ampM} y={-1.05} r={2.5} color="var(--stage-accent)" />
            <Dot x={eqX + ampM} y={-1.05} r={2.5} color="var(--stage-accent)" />
            {/* ABOVE its own bar: below it, this shared a line with "equilibrium · x = 0". */}
            <Label x={eqX} y={-1.05} text="2A" color="var(--stage-accent)" size={10} dy={-6} />
            {/* coil spring */}
            <Polyline points={coil} color="var(--stage-metal, var(--stage-fg))" weight={2.4} opacity={0.9} />
            {/* mass block (solid) */}
            <Polygon
              points={[
                { x: massLeft, y: -half },
                { x: x + half, y: -half },
                { x: x + half, y: half },
                { x: massLeft, y: half },
              ]}
              color="color-mix(in oklab, var(--stage-accent) 55%, black)"
              fill="var(--stage-accent)"
              fillOpacity={0.9}
              weight={1.6}
            />
            {/* restoring force arrow */}
            {Math.abs(Fx) > 0.5 && (
              <CompactVector
                tail={{ x, y: 1.5 }}
                tip={{ x: x + clamp(Fx * 0.04, -3, 3), y: 1.5 }}
                color="color-mix(in oklab, var(--stage-warn) 78%, var(--stage-fg))"
              />
            )}
          </Stage>
        );
      })()
    : (() => {
        const pivot = { x: 0, y: 1.8 };
        const th = ((ampDeg * Math.PI) / 180) * u; // current angle
        const Ls = clamp(L, 1, 3.2); // drawn length
        const bob = { x: pivot.x + Ls * Math.sin(th), y: pivot.y - Ls * Math.cos(th) };
        const amplitudeRad = (ampDeg * Math.PI) / 180;
        const motionEnvelope: Vec2[] = Array.from({ length: 25 }, (_, index) => {
          const angle = -amplitudeRad + (index / 24) * amplitudeRad * 2;
          return { x: pivot.x + Ls * Math.sin(angle), y: pivot.y - Ls * Math.cos(angle) };
        });
        const forceDirection = -Math.sign(th || 1);
        const forceTail = {
          x: bob.x + Math.cos(th) * forceDirection * 0.42,
          y: bob.y + Math.sin(th) * forceDirection * 0.42,
        };
        const forceTip = {
          x: forceTail.x + Math.cos(th) * forceDirection * 0.72,
          y: forceTail.y + Math.sin(th) * forceDirection * 0.72,
        };
        return (
          <Stage
            view={{ xMin: -4, xMax: 4, yMin: -2.2, yMax: 2.4 }}
            height={170}
            preserveAspect
            ariaLabel={`Pendulum swinging, angle ${(ampDeg * u).toFixed(0)} degrees`}
          >
            {/* support */}
            <Segment
              from={{ x: -1.4, y: pivot.y }}
              to={{ x: 1.4, y: pivot.y }}
              color="var(--stage-fg)"
              opacity={0.6}
              weight={3}
            />
            {/* equilibrium (vertical) */}
            <Segment
              from={pivot}
              to={{ x: pivot.x, y: pivot.y - Ls }}
              color="var(--stage-muted)"
              opacity={0.5}
              weight={1}
              dashed
            />
            <Polyline points={motionEnvelope} color="var(--stage-accent)" opacity={0.2} weight={1.5} />
            {/* Beside the dashed line it names, halfway down. At the foot of the line it sat on the
                bob and its mass label whenever the pendulum hung still. */}
            <Label
              x={pivot.x}
              y={pivot.y - Ls / 2}
              text="equilibrium"
              color="var(--stage-good)"
              size={10}
              dx={-8}
              anchor="end"
            />
            {/* string + bob */}
            <Segment from={pivot} to={bob} color="var(--stage-fg)" opacity={0.6} weight={1.5} />
            <Dot x={pivot.x} y={pivot.y} r={3} color="var(--stage-fg)" />
            <Circle
              center={bob}
              r={0.42}
              color="color-mix(in oklab, var(--stage-accent) 48%, var(--stage-fg))"
              fill="color-mix(in oklab, var(--stage-accent) 72%, var(--stage-bg))"
              fillOpacity={1}
              weight={2}
            />
            <Circle
              center={{ x: bob.x - 0.1, y: bob.y + 0.11 }}
              r={0.1}
              color="color-mix(in oklab, var(--stage-bg) 70%, transparent)"
              fill="color-mix(in oklab, var(--stage-bg) 70%, transparent)"
              fillOpacity={0.85}
              weight={0}
            />
            {/* restoring force (tangential, ∝ −sinθ) */}
            {Math.abs(th) > 0.02 && (
              <CompactVector
                tail={forceTail}
                tip={forceTip}
                color="color-mix(in oklab, var(--stage-warn) 72%, var(--stage-fg))"
              />
            )}
          </Stage>
        );
      })();

  // ---- x(t) trace (a sine, the wave link) ----
  const A_PX = 1.0;
  const curve: Vec2[] = [];
  for (let i = 0; i <= 120; i++) {
    const tau = t - WIN + (i / 120) * WIN; // [t−WIN, t]
    curve.push({ x: i / 120, y: A_PX * Math.cos(omega * tau) });
  }
  const trace = (
    <Stage
      view={{ xMin: 0, xMax: 1, yMin: -1.4, yMax: 1.4 }}
      height={130}
      preserveAspect={false}
      ariaLabel="Displacement traced against time, a sine curve"
    >
      <Segment from={{ x: 0, y: 0 }} to={{ x: 1, y: 0 }} color="var(--stage-fg)" opacity={0.4} weight={1} />
      <Segment
        from={{ x: 0, y: 1 }}
        to={{ x: 1, y: 1 }}
        color="var(--stage-accent)"
        opacity={0.18}
        weight={1}
        dashed
      />
      <Segment
        from={{ x: 0, y: -1 }}
        to={{ x: 1, y: -1 }}
        color="var(--stage-accent)"
        opacity={0.18}
        weight={1}
        dashed
      />
      <Label
        x={0}
        y={1.4}
        text="displacement x(t)"
        color="var(--stage-fg)"
        size={10}
        anchor="start"
        dy={-2}
      />
      <Label x={1} y={0} text="time →" color="var(--stage-fg)" size={10} anchor="end" dy={14} />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      {/* current value at the right edge */}
      <Dot x={1} y={A_PX * u} r={4} color="var(--stage-accent)" />
    </Stage>
  );

  const aside = (
    <div className="physics-instrument-stack">
      <div className="physics-dynamics-ledger">
        <div>
          <span>Angular frequency · {isSpring ? '√(k/m)' : '√(g/L)'}</span>
          <strong>{omega.toFixed(2)} rad/s</strong>
        </div>
        <div data-highlight>
          <span>Period · T</span>
          <strong>{T.toFixed(2)} s</strong>
        </div>
        <div>
          <span>Frequency · f</span>
          <strong>{f.toFixed(2)} Hz</strong>
        </div>
      </div>
      <MeterBar
        label={isSpring ? 'elastic PE = ½kx²' : 'gravitational PE'}
        frac={peFrac}
        color="var(--stage-accent-2)"
        value={`${Math.round(peFrac * 100)}%`}
      />
      <MeterBar
        label="kinetic KE = ½mv²"
        frac={keFrac}
        color="var(--stage-good)"
        value={`${Math.round(keFrac * 100)}%`}
      />
      <p className="physics-explain">
        The trace is a <strong>sine</strong>, a wave is just this swing spread through space (v = fλ in the
        waves lab).{' '}
        {isSpring
          ? 'Heavier or softer spring ⇒ slower (T = 2π√(m/k)).'
          : 'Notice: change the mass or the amplitude and T doesn’t move, a pendulum’s period is T = 2π√(L/g).'}
      </p>
      <LiveRegion>{`${isSpring ? 'Spring' : 'Pendulum'} oscillator. Angular frequency ${omega.toFixed(2)}, period ${T.toFixed(2)} seconds.`}</LiveRegion>
    </div>
  );

  const controls = (
    <>
      <Control name="mode">
        <div className="lab-segmented-field">
          <span className="lab-field-label">mode</span>
          <Segmented
            ariaLabel="oscillator type"
            value={isSpring ? 'spring' : 'pendulum'}
            onChange={setMd}
            options={[
              { value: 'spring', label: 'spring' },
              { value: 'pendulum', label: 'pendulum' },
            ]}
          />
        </div>
      </Control>
      {isSpring ? (
        <>
          <Field label="stiffness k" value={`${kk} N/m`}>
            <Slider
              value={kk}
              min={2}
              max={30}
              step={1}
              onChange={setKk}
              ariaLabel="spring stiffness (N/m)"
            />
          </Field>
          <Field label="mass m" value={`${m} kg`}>
            <Slider value={m} min={0.5} max={5} step={0.5} onChange={setM} ariaLabel="mass (kg)" />
          </Field>
          <Field label="amplitude" value={`${ampM.toFixed(1)} m`}>
            <Slider value={ampM} min={0.8} max={3} step={0.2} onChange={setAmpM} ariaLabel="amplitude (m)" />
          </Field>
        </>
      ) : (
        <>
          <Field label="length L" value={`${L.toFixed(1)} m`}>
            <Slider value={L} min={1} max={3.2} step={0.2} onChange={setL} ariaLabel="pendulum length (m)" />
          </Field>
          <Field label="mass m" value={`${m} kg`}>
            <Slider
              value={m}
              min={0.5}
              max={5}
              step={0.5}
              onChange={setM}
              ariaLabel="bob mass (kg): does not change the period"
            />
          </Field>
          <Field label="amplitude" value={`${ampDeg}°`}>
            <Slider
              value={ampDeg}
              min={2}
              max={12}
              step={1}
              onChange={setAmpDeg}
              ariaLabel="small-angle amplitude (degrees)"
            />
          </Field>
        </>
      )}
      <SimulationTransport
        running={gate.playing}
        onReset={() => {
          tRef.current = 0;
          gate.setPlaying(false);
          paint((n) => n + 1);
        }}
        onToggle={() => gate.setPlaying(!gate.playing)}
        state={gate.playing ? 'Oscillating' : 'Paused'}
        detail={`${isSpring ? 'spring' : 'pendulum'} · ${omega.toFixed(2)} rad/s`}
        resetLabel="Reset oscillator"
      />
    </>
  );

  const displacement = isSpring ? `${(ampM * u).toFixed(2)} m` : `${(ampDeg * u).toFixed(0)}°`;
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Oscillations"
      title={title}
      description={prompt}
      status={
        <>
          <span>{isSpring ? 'Spring' : 'Pendulum'}</span>
          <span>x {displacement}</span>
          <span>T {T.toFixed(2)} s</span>
          <span>f {f.toFixed(2)} Hz</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        isSpring
          ? 'At the centre, speed and kinetic energy peak. At either extreme, the mass pauses and stored energy peaks.'
          : 'Changing mass leaves the period fixed; changing length changes the rhythm.'
      }
      transcript={
        <p>{`${isSpring ? 'Spring' : 'Pendulum'} displacement is ${displacement}. The period is ${T.toFixed(2)} seconds and frequency is ${f.toFixed(2)} hertz.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="played" met={gate.playing} complete={complete} />
          <AuthoredMetricGate
            conditionId="model-changed"
            met={
              md !== mode ||
              kk !== k ||
              L !== length ||
              m !== mass ||
              (amplitude != null && (isSpring ? ampM !== amplitude : ampDeg !== amplitude))
            }
            complete={complete}
          />
          <div ref={gate.ref} className="physics-visual-stack">
            <SceneSurface>{scene}</SceneSurface>
            <TracePanel title="Displacement trace" detail="Position through time; the moving point is now">
              {trace}
            </TracePanel>
          </div>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
