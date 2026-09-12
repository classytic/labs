'use client';

/**
 * WorkEnergyLab, "work done" you can SEE: work is the AREA under the force–distance
 * graph. Two situations on one figure, a SPRING (F = kx, so W = ½kx², the triangle)
 * and a CONSTANT force (W = Fx, the rectangle). Drag the distance and the shaded area
 * (the work) grows with it; the equation updates in real maths (KaTeX). Interactive,
 * not a timed sim, the graph recomputes as you drag.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Polygon, Segment, Dot, Label, type Vec2 } from '@classytic/stage';
import { Field } from '../../kit/frame.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { SceneSurface } from '../mechanics/presentation.js';

const X_MAX = 4;
const ACCENT = 'var(--stage-accent)';

const WORK_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Work is area: rectangle or triangle?',
  objectives: [
    'Read work as area under a force-distance graph',
    'Compare constant and variable force',
    'Predict how work scales when distance doubles',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the scaling',
      lead: 'Commit before changing the distance.',
      success: 'scaling-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Build an area',
      lead: 'Change distance and watch the shaded region respond.',
      controls: true,
      reveal: ['model'],
      success: 'distance-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read graph and equation together',
      lead: 'Match the shaded geometry to the live calculation.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the exponent',
      lead: 'Explain why a spring grows in width and height.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Switch the force model',
      lead: 'Compare the spring triangle with the constant-force rectangle.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'mode-changed',
    },
  ],
  questions: [
    {
      id: 'scaling',
      prompt: 'For a spring obeying F = kx, doubling the stretch makes the work…',
      choices: [
        { value: 'double', label: 'twice as large' },
        { value: 'quadruple', label: 'four times as large' },
        { value: 'same', label: 'unchanged' },
      ],
      answer: 'quadruple',
      explain: 'W = ½kx², so doubling x multiplies the triangular area by four.',
    },
  ],
  success: [
    {
      id: 'scaling-answer',
      source: 'answer',
      key: 'scaling',
      operator: 'eq',
      value: 'quadruple',
      pendingLabel: 'Choose how spring work scales.',
    },
    {
      id: 'distance-changed',
      source: 'metric',
      key: 'distanceChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the distance.',
    },
    {
      id: 'mode-changed',
      source: 'metric',
      key: 'modeChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch the force model.',
    },
  ],
};

export interface WorkEnergyProps {
  mode?: 'spring' | 'constant';
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

/** A little spring (stretching) or a box pushed by a constant force, displaced by x. */
function Picture({ mode, x }: { mode: 'spring' | 'constant'; x: number }): ReactNode {
  const W = 360,
    H = 64,
    x0 = 14,
    rest = 90,
    span = 150;
  const frac = x / X_MAX;
  if (mode === 'spring') {
    const len = rest + frac * 120;
    const bx = x0 + 20 + len;
    // A real coil (helix), not a triangular zigzag: y = sin gives the loops, a small x wobble
    // rounds each one, and a fixed coil count over a growing body ⇒ it visibly stretches.
    const cy = H / 2,
      xa = x0 + 12,
      xb = bx - 6,
      bodyLen = xb - xa,
      coils = 9,
      amp = 13,
      N = coils * 16;
    let d = `M ${x0} ${cy} L ${xa} ${cy}`;
    for (let i = 1; i <= N; i++) {
      const s = i / N,
        ang = s * coils * Math.PI * 2;
      d += ` L ${(xa + s * bodyLen + 2 * Math.cos(ang)).toFixed(1)} ${(cy - amp * Math.sin(ang)).toFixed(1)}`;
    }
    d += ` L ${bx} ${cy}`;
    return (
      <svg
        className="physics-work-icon"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="a spring stretched by x"
      >
        <line x1={x0} y1={6} x2={x0} y2={H - 6} stroke="var(--stage-metal)" strokeWidth={4} />
        <path d={d} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
        <rect
          x={bx}
          y={H / 2 - 14}
          width={26}
          height={28}
          rx={3}
          fill="color-mix(in oklab, var(--stage-accent) 30%, var(--stage-bg))"
          stroke={ACCENT}
          strokeWidth={2}
        />
      </svg>
    );
  }
  const bx = x0 + 30 + frac * 150;
  return (
    <svg
      className="physics-work-icon"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="a box pushed by a constant force over distance x"
    >
      <line x1={4} y1={H - 10} x2={W - 4} y2={H - 10} stroke="var(--stage-grid)" strokeWidth={2} />
      <rect
        x={bx}
        y={H - 38}
        width={28}
        height={28}
        rx={3}
        fill="color-mix(in oklab, var(--stage-accent) 30%, var(--stage-bg))"
        stroke={ACCENT}
        strokeWidth={2}
      />
      <line
        x1={bx - 30}
        y1={H - 24}
        x2={bx - 4}
        y2={H - 24}
        stroke="var(--stage-warn)"
        strokeWidth={3}
        markerEnd="url(#stage-arrow)"
      />
      <text
        x={bx - 17}
        y={H - 30}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="var(--stage-warn)"
      >
        F
      </text>
    </svg>
  );
}

export function WorkEnergyLab({
  mode: mode0 = 'spring',
  title = 'Work done: it’s the area under the force',
  prompt = 'Pull the distance up and watch the work (the shaded area) grow. A spring fights back harder the further you go, so its work grows as x².',
  objectives,
  activity = 'work-energy',
}: WorkEnergyProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'work-energy';
  const authoredActivity = typeof activity === 'string' ? WORK_ACTIVITY : activity;
  const [mode, setMode] = useState<'spring' | 'constant'>(mode0);
  const [k, setK] = useState(3);
  const [force, setForce] = useState(8);
  const [x, setX] = useState(2.5);

  const spring = mode === 'spring';
  const Fx = spring ? k * x : force;
  const W = spring ? 0.5 * k * x * x : force * x;
  const yTop = (spring ? k * X_MAX : force) * 1.15 + 1;
  const view = { xMin: -0.55, xMax: X_MAX + 0.4, yMin: -yTop * 0.12, yMax: yTop };

  const area: Vec2[] = spring
    ? [
        { x: 0, y: 0 },
        { x, y: 0 },
        { x, y: Fx },
      ]
    : [
        { x: 0, y: 0 },
        { x, y: 0 },
        { x, y: force },
        { x: 0, y: force },
      ];
  const fullFrom: Vec2 = spring ? { x: 0, y: 0 } : { x: 0, y: force };
  const fullTo: Vec2 = spring ? { x: X_MAX, y: k * X_MAX } : { x: X_MAX, y: force };

  const figure = (
    <SceneSurface className="physics-work-energy-scene">
      <div className="physics-work-energy-context">
        <Picture mode={mode} x={x} />
        <span>{spring ? 'Restoring force rises with stretch' : 'Force stays constant'}</span>
      </div>
      <Stage
        view={view}
        height={300}
        preserveAspect={false}
        ariaLabel="Force versus displacement; work is the shaded area under the line"
      >
        <Grid />
        <Axes ticks />
        <Polygon
          points={area}
          fill="color-mix(in oklab, var(--stage-accent) 22%, transparent)"
          color="transparent"
        />
        <Segment from={fullFrom} to={fullTo} color="var(--stage-metal)" weight={1.5} />
        <Segment
          from={spring ? { x: 0, y: 0 } : { x: 0, y: force }}
          to={{ x, y: Fx }}
          color={ACCENT}
          weight={3}
        />
        <Segment from={{ x, y: 0 }} to={{ x, y: Fx }} color="var(--stage-grid)" weight={1} dashed />
        <Dot x={x} y={Fx} r={5} color={ACCENT} />
        <Label x={X_MAX / 2} y={-yTop * 0.07} text="distance x (m)" color="var(--stage-muted)" />
        <Label x={0.05} y={yTop * 0.95} text="force F (N)" color="var(--stage-muted)" anchor="start" />
      </Stage>
    </SceneSurface>
  );

  const instruments = (
    <>
      <div className="physics-probe">
        <span>Work done</span>
        <strong className="physics-equation-result">
          <Tex
            tex={
              spring
                ? `W=\\tfrac12 k x^{2}=${W.toFixed(1)}\\,\\mathrm{J}`
                : `W=Fx=${W.toFixed(1)}\\,\\mathrm{J}`
            }
          />
        </strong>
        <small>{spring ? 'Triangle area: half × base × height' : 'Rectangle area: base × height'}</small>
      </div>
      <p className="physics-explain">
        The shaded region is the work transferred.{' '}
        {spring ? (
          <>
            Because force rises with distance, W grows as <Tex tex="x^2" />.
          </>
        ) : (
          'With steady force, work grows directly with distance.'
        )}
      </p>
    </>
  );

  const controls = (
    <>
      <Field label="situation">
        <Segmented
          ariaLabel="situation"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'spring', label: 'spring (F = kx)' },
            { value: 'constant', label: 'constant force' },
          ]}
        />
      </Field>
      {spring ? (
        <Field label="spring constant k" value={`${k} N/m`}>
          <Slider value={k} min={1} max={6} step={0.5} onChange={setK} ariaLabel="spring constant" />
        </Field>
      ) : (
        <Field label="force F" value={`${force} N`}>
          <Slider value={force} min={2} max={14} step={1} onChange={setForce} ariaLabel="force" />
        </Field>
      )}
      <Field label="distance x" value={`${x.toFixed(1)} m`}>
        <Slider value={x} min={0} max={X_MAX} step={0.1} onChange={setX} ariaLabel="distance pulled" />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{spring ? 'Variable force' : 'Constant force'}</span>
          <span>x {x.toFixed(1)} m</span>
          <span>W {W.toFixed(1)} J</span>
        </>
      }
      evidence={instruments}
      controls={controls}
      observation={
        spring
          ? 'The triangular shaded area grows in both width and height, so doubling stretch quadruples the work.'
          : 'The rectangular shaded area grows only in width, so doubling distance doubles the work.'
      }
      transcript={
        <p>{`${spring ? 'Spring' : 'Constant-force'} model: at ${x.toFixed(1)} metres the force is ${Fx.toFixed(1)} newtons and the shaded area represents ${W.toFixed(1)} joules of work.`}</p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="distance-changed" met={x !== 2.5} complete={complete} />
          <AuthoredMetricGate conditionId="mode-changed" met={mode !== mode0} complete={complete} />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
