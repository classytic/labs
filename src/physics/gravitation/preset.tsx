'use client';

/**
 * GravitationLab, "Inverse-square", how gravity fades with distance.
 *
 * Newton's law of universal gravitation: F = G·M·m / r². Drag the satellite and
 * the pull on it tracks 1/r², DOUBLE the distance and the force drops to a
 * QUARTER (not a half), the defining surprise of an inverse-square law. The same
 * rule is why weight shrinks with altitude (g = GM/r²). A live F-vs-r curve marks
 * where you are on the steep 1/r² fall-off.
 *
 * Interactive (drag the satellite), no timed loop. Tokenized SVG.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Circle, Dot, Segment, Label, MovableDot, Polyline, type Vec2 } from '@classytic/stage';
import { EarthGlyph, SatelliteGlyph } from '../../kit/space.js';
import { ActionButton, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { clamp } from '../../core/util.js';
import { MechanicsVector, SceneSurface, TracePanel } from '../mechanics/presentation.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { inverseSquareForce } from '../orbital/core.js';

const GRAVITATION_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Inverse-square gravity: spread the field',
  objectives: [
    'Predict inverse-square scaling',
    'Connect distance to field strength',
    'Transfer the law to mass and altitude changes',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the scaling',
      lead: 'Commit before moving the satellite.',
      success: 'quarter-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Move through the field',
      lead: 'Drag the satellite or use the distance controls.',
      controls: true,
      reveal: ['model'],
      success: 'radius-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Link orbit and graph',
      lead: 'Read the force arrow and inverse-square curve together.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the quarter',
      lead: 'Connect spherical spreading to the r² denominator.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change a mass',
      lead: 'Change either mass and compare it with changing distance.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'mass-changed',
    },
  ],
  questions: [
    {
      id: 'quarter',
      prompt: 'Double the distance between two masses. The gravitational force becomes…',
      choices: [
        { value: 'quarter', label: 'one quarter' },
        { value: 'half', label: 'one half' },
        { value: 'double', label: 'twice as large' },
      ],
      answer: 'quarter',
      explain: 'F is proportional to 1/r², so doubling r divides the force by four.',
    },
  ],
  success: [
    {
      id: 'quarter-answer',
      source: 'answer',
      key: 'quarter',
      operator: 'eq',
      value: 'quarter',
      pendingLabel: 'Choose the inverse-square result.',
    },
    {
      id: 'radius-changed',
      source: 'metric',
      key: 'radiusChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Move the satellite to a different radius.',
    },
    {
      id: 'mass-changed',
      source: 'metric',
      key: 'massChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the planet or satellite mass.',
    },
  ],
};

export interface GravitationProps {
  /** Planet mass (relative units). */
  planetMass?: number;
  satMass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['planet mass M'] }`. */
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}

const R_MIN = 2.4,
  R_MAX = 9;
const K_BASE = 60; // G in drawn units (F = K·M·m / r²)

export function GravitationLab({
  planetMass = 5,
  satMass = 1,
  title = 'Inverse-square gravity: double the distance, quarter the pull',
  prompt = 'Newton’s law: F = G·M·m / r². Drag the satellite in and out, the pull follows 1/r², so moving twice as far drops the force to a quarter, not a half. It’s the same law that thins your weight with altitude (g = GM/r²).',
  objectives,
  controlConfig,
  activity = 'gravitation',
}: GravitationProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'gravitation';
  const authoredActivity = typeof activity === 'string' ? GRAVITATION_ACTIVITY : activity;
  const [M, setM] = useState(planetMass);
  const [m, setm] = useState(satMass);
  const [sat, setSat] = useState<Vec2>({ x: 4.6, y: 0 });

  const r = Math.hypot(sat.x, sat.y);
  const K = K_BASE * M * m;
  const F = inverseSquareForce(K_BASE, M, m, r);
  const planet = { x: -4.5, y: 0 };
  const satellite = { x: planet.x + r, y: 0 };

  const onMove = (p: Vec2): void => setSat({ x: clamp(p.x - planet.x, R_MIN, R_MAX), y: 0 });

  // force arrow length: gentle scaling so it stays readable across the range
  const arrowLen = clamp(0.8 + 2.2 * Math.sqrt(F / (K / (R_MIN * R_MIN))), 0.8, r * 0.52);
  const view = { xMin: -6.2, xMax: 5.6, yMin: -3.2, yMax: 3.2 };

  // F-vs-r curve
  const curve: Vec2[] = [];
  for (let i = 0; i <= 80; i++) {
    const rr = R_MIN + (i / 80) * (R_MAX - R_MIN);
    curve.push({ x: rr, y: K / (rr * rr) });
  }
  const Fmax = K / (R_MIN * R_MIN);

  const figure = (
    <SceneSurface tone="space" className="physics-orbit-space">
      <Stage
        view={view}
        height={300}
        preserveAspect
        ariaLabel={`Satellite at distance ${r.toFixed(1)}, gravitational pull ${F.toFixed(1)}`}
      >
        <Segment
          from={planet}
          to={{ x: planet.x + R_MAX, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.22}
          weight={1.2}
        />
        {[3, 6, 9].map((rr) => (
          <g key={`radius-${rr}`}>
            <Segment
              from={{ x: planet.x + rr, y: -0.12 }}
              to={{ x: planet.x + rr, y: 0.12 }}
              color="var(--stage-muted)"
              opacity={0.7}
              weight={1}
            />
          </g>
        ))}
        <Segment from={planet} to={satellite} color="var(--stage-accent)" opacity={0.55} weight={2} />
        {/* planet (Earth) */}
        <EarthGlyph center={planet} r={0.72 + M * 0.1} />
        {/* gravitational pull on the satellite (toward the planet) */}
        <MechanicsVector
          tail={satellite}
          tip={{ x: satellite.x - arrowLen, y: 0 }}
          color="var(--stage-warn)"
          active
        />
        {/* Keep the accessible drag target below the artwork so it never obscures the satellite. */}
        <MovableDot
          value={satellite}
          onMove={onMove}
          color="var(--stage-accent)"
          ariaLabel="satellite, drag to change distance"
        />
        <SatelliteGlyph center={satellite} size={0.58} />
      </Stage>
    </SceneSurface>
  );

  const graph = (
    <TracePanel
      className="physics-orbit-graph"
      title="Force profile"
      detail="Normalized pull F/F₀ against distance r/r₀"
    >
      <Stage
        view={{ xMin: 0, xMax: R_MAX, yMin: 0, yMax: Fmax }}
        height={150}
        preserveAspect={false}
        ariaLabel="Force versus distance, an inverse-square curve"
      >
        <Segment
          from={{ x: 0, y: 0 }}
          to={{ x: R_MAX, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.5}
          weight={1.2}
        />
        <Segment
          from={{ x: 0, y: 0 }}
          to={{ x: 0, y: Fmax }}
          color="var(--stage-fg)"
          opacity={0.5}
          weight={1.2}
        />
        <Label x={0} y={Fmax} text="F" color="var(--stage-fg)" size={10} anchor="start" dy={-2} />
        <Label x={R_MAX} y={0} text="r →" color="var(--stage-fg)" size={10} anchor="end" dy={14} />
        <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
        <Segment
          from={{ x: clamp(r, R_MIN, R_MAX), y: 0 }}
          to={{ x: clamp(r, R_MIN, R_MAX), y: F }}
          color="var(--stage-warn)"
          opacity={0.6}
          weight={1}
          dashed
        />
        <Dot x={clamp(r, R_MIN, R_MAX)} y={F} r={4} color="var(--stage-warn)" />
      </Stage>
    </TracePanel>
  );

  const aside = (
    <>
      <div className="physics-orbital-ledger">
        <div>
          <span>Distance · r</span>
          <strong>{r.toFixed(1)} r₀</strong>
        </div>
        <div>
          <span>Pull · GMm/r²</span>
          <strong>{F.toFixed(1)} F₀</strong>
        </div>
        <div data-highlight>
          <span>At twice the distance</span>
          <strong>{(F / 4).toFixed(1)} F₀ · ¼</strong>
        </div>
      </div>
      <p className="physics-explain">
        The curve falls as 1/r², steeply near the planet, then a long faint tail. Same maths gives orbital
        speed v = √(GM/r) and ties straight into the Kepler lab.
      </p>
      <LiveRegion>{`Distance ${r.toFixed(1)}, pull ${F.toFixed(1)}. Doubling the distance quarters the force.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <div className="lab-field-row">
        <ActionButton onClick={() => setRadius(r / 2)} disabled={r <= R_MIN + 0.01}>
          ½ distance
        </ActionButton>
        <ActionButton onClick={() => setRadius(r * 2)} disabled={r >= R_MAX - 0.01}>
          2× distance
        </ActionButton>
      </div>
      <Field label="planet mass M" value={`${M}`}>
        <Slider value={M} min={1} max={9} step={1} onChange={setM} ariaLabel="planet mass" />
      </Field>
      <Field label="satellite mass m" value={`${m}`}>
        <Slider value={m} min={1} max={5} step={1} onChange={setm} ariaLabel="satellite mass" />
      </Field>
    </>
  );

  const setRadius = (next: number): void => {
    const rr = clamp(next, R_MIN, R_MAX);
    setSat({ x: rr, y: 0 });
  };
  const initialRadius = 4.6;
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Orbital mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>r {r.toFixed(1)}</span>
          <span>F {F.toFixed(1)}</span>
          <span>at 2r {(F / 4).toFixed(1)}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="Doubling distance spreads the same gravitational influence across four times the spherical area, so the pull falls to one quarter."
      transcript={
        <p>{`The satellite is ${r.toFixed(1)} units from the planet and feels ${F.toFixed(1)} force units. At twice this radius the force would be ${(F / 4).toFixed(1)}.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="radius-changed"
            met={Math.abs(r - initialRadius) > 0.2}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="mass-changed"
            met={M !== planetMass || m !== satMass}
            complete={complete}
          />
          <div className="physics-visual-stack">
            {figure}
            {graph}
          </div>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
