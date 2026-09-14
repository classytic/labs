'use client';

/**
 * EnergySkateLab, "Where did the energy go?", KE ⇄ PE on a ramp, with friction
 * bleeding the total into heat.
 *
 * A skater is released from a height on a parabolic ramp. Three stacked bars ,
 * potential, kinetic, and thermal, ALWAYS sum to the same total: as the skater
 * drops, the PE bar empties into the KE bar and back on the way up. Turn friction
 * on and a THERMAL bar grows each pass, so the skater can never climb as high
 * again, mechanical energy isn't destroyed, it's moved to heat. (The "LOL" energy
 * bar chart, animated.)
 *
 * This complements WorkEnergyLab (work = area under F–x): here the spotlight is
 * CONVERSION and conservation, not the definition of work.
 *
 * Tokenized SVG; energy-method integrator here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Stage, Segment, Polyline, Polygon, Label, Dot, useInView, type Vec2 } from '@classytic/stage';
import { Slider, Chip } from '../../kit/controls.js';
import { Field, Control, MeterBar, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';
import { MechanicsActivity } from '../mechanics/activity.js';
import { SceneSurface, SimulationTransport } from '../mechanics/presentation.js';
import { energySnapshot, parabolicTrackHeight } from '../mechanics/core.js';
import { SkaterGlyph } from '../mechanics/glyphs.js';

export interface EnergySkateProps {
  startHeight?: number;
  friction?: boolean;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
  /** Lock/hide knobs, e.g. `{ hide: ['friction'] }` to pin friction off (or on). */
  controlConfig?: ControlConfig;
}

const G = 9.8;
const X = 6; // ramp half-width
const H = 5; // ramp height at the lip
const MU = 0.08; // rolling-friction coefficient (energy per metre = μ·m·g)
const yAt = (x: number): number => parabolicTrackHeight(x, X, H);

export function EnergySkateLab({
  startHeight = 4,
  friction = false,
  mass = 1,
  title = 'Where did the energy go?: KE ⇄ PE (and heat)',
  prompt = 'Release the skater and watch potential energy pour into kinetic and back. The three bars always add to the same total, unless friction is on, then a heat bar grows and the skater can’t climb as high again.',
  objectives,
  controlConfig,
  activity,
}: EnergySkateProps): ReactNode {
  const [h0, setH0] = useState(clamp(startHeight, 1, H));
  const [fric, setFric] = useState(friction);
  const [m] = useState(mass);
  const [running, setRunning] = useState(false);

  // release point: x0 on the left wall at height h0
  const x0 = -X * Math.sqrt(h0 / H);
  const E0 = m * G * h0; // total energy budget

  const xRef = useRef(x0);
  const dirRef = useRef(1); // +1 → moving right
  const qRef = useRef(0); // thermal energy accumulated
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const SCALE = 0.5;

  const repaint = useFrameTick(running && inView, (f) => {
    const dt = Math.min(0.03, f.dtMs / 1000);
    let x = xRef.current;
    const y = yAt(x);
    let ke = E0 - m * G * y - qRef.current;
    // friction has eaten essentially all the mechanical energy → settle and stop
    // (unconditional, so it can't jitter forever at vanishing amplitude).
    if (fric && E0 - qRef.current <= m * G * 0.03) {
      xRef.current = 0;
      setRunning(false);
      return;
    }
    if (ke <= 0) {
      // turning point, reverse direction
      dirRef.current = -dirRef.current;
      ke = 0;
    }
    const v = Math.sqrt(Math.max(0, (2 * ke) / m));
    // horizontal step (projected); good enough for the energy story
    const dx = dirRef.current * v * SCALE * dt;
    x = clamp(x + dx, -X, X);
    if (Math.abs(x) >= X) dirRef.current = -dirRef.current; // bounce off the lip
    if (fric) qRef.current = Math.min(E0, qRef.current + MU * m * G * Math.abs(dx));
    xRef.current = x;
  });

  const release = (): void => {
    xRef.current = x0;
    dirRef.current = 1;
    qRef.current = 0;
    if (reduce) {
      xRef.current = 0;
      repaint();
      return;
    }
    setRunning(true);
  };
  const onH0 = (n: number): void => {
    setH0(clamp(n, 1, H));
    setRunning(false);
    xRef.current = -X * Math.sqrt(clamp(n, 1, H) / H);
    dirRef.current = 1;
    qRef.current = 0;
  };

  // live energies
  const x = xRef.current;
  const y = yAt(x);
  const energy = energySnapshot(E0, m, G, y, qRef.current);
  const pe = energy.potential;
  const ke = energy.kinetic;
  const q = energy.thermal;

  const track: Vec2[] = [];
  for (let i = -X; i <= X + 1e-9; i += 0.25) track.push({ x: i, y: yAt(i) });
  const trackFill: Vec2[] = [{ x: -X, y: 0 }, ...track, { x: X, y: 0 }];
  const view = { xMin: -X - 1, xMax: X + 1, yMin: -1, yMax: H + 1 };

  const figure = (
    <SceneSurface ref={viewRef} tone="grid" className="physics-energy-skate-scene">
      <Stage
        view={view}
        height={250}
        preserveAspect={false}
        ariaLabel={`Skater on a ramp released from ${h0.toFixed(1)} m${fric ? ', with friction' : ''}`}
      >
        <Polygon
          points={trackFill}
          fill="var(--stage-primary)"
          fillOpacity={0.08}
          color="var(--stage-primary)"
          opacity={0}
          weight={0}
        />
        {/* ground */}
        <Segment
          from={{ x: view.xMin, y: 0 }}
          to={{ x: view.xMax, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.3}
          weight={1}
        />
        {/* release-height guide */}
        <Segment
          from={{ x: view.xMin, y: h0 }}
          to={{ x: view.xMax, y: h0 }}
          color="var(--stage-muted)"
          opacity={0.5}
          weight={1}
          dashed
        />
        <Dot x={x0} y={h0} r={4} color="var(--stage-primary)" />
        <Label
          x={x0}
          y={h0}
          text={`${h0.toFixed(1)} m start`}
          color="var(--stage-muted)"
          size={10}
          anchor="middle"
          dy={-12}
        />
        {/* the ramp */}
        <Polyline points={track} color="var(--stage-primary)" weight={4} />
        <Label x={0} y={0.35} text="lowest PE · fastest" color="var(--stage-muted)" size={10} anchor="middle" />
        <SkaterGlyph at={{ x, y: y + 0.18 }} direction={dirRef.current > 0 ? 1 : -1} />
      </Stage>
    </SceneSurface>
  );

  const ebar = E0 > 0 ? 1 / E0 : 0;
  const aside = (
    <>
      <MeterBar
        label="potential PE = mgh"
        frac={pe * ebar}
        color="var(--stage-accent-2)"
        value={`${pe.toFixed(1)} J`}
      />
      <MeterBar
        label="kinetic KE = ½mv²"
        frac={ke * ebar}
        color="var(--stage-good)"
        value={`${ke.toFixed(1)} J`}
      />
      {fric && (
        <MeterBar
          label="thermal energy"
          frac={q * ebar}
          color="var(--stage-warn)"
          value={`${q.toFixed(1)} J`}
        />
      )}
      <div className="physics-probe">
        <span>Energy account</span>
        <strong className="lab-tabular">
          PE + KE{fric ? ' + heat' : ''} = <strong>{(pe + ke + (fric ? q : 0)).toFixed(1)} J</strong>
        </strong>
        <small>constant budget {E0.toFixed(1)} J</small>
      </div>
      <LiveRegion>{`Potential ${pe.toFixed(1)}, kinetic ${ke.toFixed(1)}${
        fric ? `, heat ${q.toFixed(1)}` : ''
      } joules; total ${E0.toFixed(1)}.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <Control name="friction">
        <Chip
          selected={fric}
          onClick={() => {
            setFric((c) => !c);
            setRunning(false);
            qRef.current = 0;
          }}
        >
          friction {fric ? 'on' : 'off'}
        </Chip>
      </Control>
      <Field label="start height" value={`${h0.toFixed(1)} m`}>
        <Slider value={h0} min={1} max={H} step={0.5} onChange={onH0} ariaLabel="release height (m)" />
      </Field>
    </>
  );

  const reset = (): void => {
    setRunning(false);
    xRef.current = x0;
    dirRef.current = 1;
    qRef.current = 0;
  };
  const transport = (
    <SimulationTransport
      running={running}
      onReset={reset}
      onToggle={running ? () => setRunning(false) : release}
      state={running ? 'Moving' : 'Ready'}
      detail={fric ? 'friction on' : 'friction off'}
      startLabel="Release"
      resetLabel="Reset skater"
    />
  );

  return (
    <MechanicsActivity
      activity={activity}
      className="physics-energy-skate"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{fric ? 'Total energy conserved' : 'Mechanical energy conserved'}</strong>
          <span>PE {pe.toFixed(1)} J</span>
          <span>KE {ke.toFixed(1)} J</span>
          {fric && <span>heat {q.toFixed(1)} J</span>}
        </>
      }
      figure={figure}
      instruments={aside}
      controls={controls}
      feedback={
        fric
          ? 'Mechanical energy becomes thermal energy, but the complete energy account stays constant.'
          : 'Potential and kinetic energy trade places while their sum stays constant.'
      }
      objectives={objectives}
      transport={transport}
      controlConfig={controlConfig}
      canvasLabel="Skater energy experiment"
      inspectorLabel="Energy and experiment controls"
    />
  );
}
