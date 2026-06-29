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
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider, Chip } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';

const X_MAX = 4;
const ACCENT = 'var(--stage-accent)';

export interface WorkEnergyProps {
  mode?: 'spring' | 'constant';
  title?: string;
  prompt?: string;
  objectives?: string[];
}

/** A little spring (stretching) or a box pushed by a constant force, displaced by x. */
function Picture({ mode, x }: { mode: 'spring' | 'constant'; x: number }): ReactNode {
  const W = 360, H = 64, x0 = 14, rest = 90, span = 150;
  const frac = x / X_MAX;
  if (mode === 'spring') {
    const len = rest + frac * 120;
    const coils = 9, step = (len - 20) / coils;
    let d = `M ${x0} ${H / 2} l 10 0`;
    for (let i = 0; i < coils; i++) d += ` l ${step / 2} -12 l ${step / 2} 12`;
    d += ` l 10 0`;
    const bx = x0 + 20 + len;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 360, display: 'block', margin: '0 auto 6px' }} role="img" aria-label="a spring stretched by x">
        <line x1={x0} y1={6} x2={x0} y2={H - 6} stroke="var(--stage-metal)" strokeWidth={4} />
        <path d={d} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={bx} y={H / 2 - 14} width={26} height={28} rx={3} fill="color-mix(in oklab, var(--stage-accent) 30%, var(--stage-bg))" stroke={ACCENT} strokeWidth={2} />
      </svg>
    );
  }
  const bx = x0 + 30 + frac * 150;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 360, display: 'block', margin: '0 auto 6px' }} role="img" aria-label="a box pushed by a constant force over distance x">
      <line x1={4} y1={H - 10} x2={W - 4} y2={H - 10} stroke="var(--stage-grid)" strokeWidth={2} />
      <rect x={bx} y={H - 38} width={28} height={28} rx={3} fill="color-mix(in oklab, var(--stage-accent) 30%, var(--stage-bg))" stroke={ACCENT} strokeWidth={2} />
      <line x1={bx - 30} y1={H - 24} x2={bx - 4} y2={H - 24} stroke="var(--stage-warn)" strokeWidth={3} markerEnd="url(#stage-arrow)" />
      <text x={bx - 17} y={H - 30} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--stage-warn)">F</text>
    </svg>
  );
}

export function WorkEnergyLab({
  mode: mode0 = 'spring',
  title = 'Work done: it’s the area under the force',
  prompt = 'Pull the distance up and watch the work (the shaded area) grow. A spring fights back harder the further you go, so its work grows as x².',
  objectives = ['Read work as the area under a force–distance graph', 'Spring: W = ½kx² (the triangle)', 'Constant force: W = Fx (the rectangle)'],
}: WorkEnergyProps = {}): ReactNode {
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
    ? [{ x: 0, y: 0 }, { x, y: 0 }, { x, y: Fx }]
    : [{ x: 0, y: 0 }, { x, y: 0 }, { x, y: force }, { x: 0, y: force }];
  const fullFrom: Vec2 = spring ? { x: 0, y: 0 } : { x: 0, y: force };
  const fullTo: Vec2 = spring ? { x: X_MAX, y: k * X_MAX } : { x: X_MAX, y: force };

  const figure = (
    <>
      <Picture mode={mode} x={x} />
      <Stage view={view} height={300} preserveAspect={false} ariaLabel="Force versus displacement; work is the shaded area under the line">
        <Grid />
        <Axes ticks />
        <Polygon points={area} fill="color-mix(in oklab, var(--stage-accent) 22%, transparent)" color="transparent" />
        <Segment from={fullFrom} to={fullTo} color="var(--stage-metal)" weight={1.5} />
        <Segment from={spring ? { x: 0, y: 0 } : { x: 0, y: force }} to={{ x, y: Fx }} color={ACCENT} weight={3} />
        <Segment from={{ x, y: 0 }} to={{ x, y: Fx }} color="var(--stage-grid)" weight={1} dashed />
        <Dot x={x} y={Fx} r={5} color={ACCENT} />
        <Label x={X_MAX / 2} y={-yTop * 0.07} text="distance x (m)" color="var(--stage-muted)" />
        <Label x={0.05} y={yTop * 0.95} text="force F (N)" color="var(--stage-muted)" anchor="start" />
      </Stage>
    </>
  );

  const aside = (
    <>
      <Callout tone="result">
        <div className="lab-field-label" style={{ marginBottom: 4 }}>work done</div>
        <span className="lab-callout-big">
          <Tex tex={spring ? `W=\\tfrac12 k x^{2}=${W.toFixed(1)}\\,\\mathrm{J}` : `W=Fx=${W.toFixed(1)}\\,\\mathrm{J}`} />
        </span>
      </Callout>
      <p className="lab-prompt">
        Work = the <b>area under the force–distance graph</b>.{' '}
        {spring
          ? <>A spring pulls back harder the further it stretches, so the area is a triangle and W grows as <Tex tex="x^2" />.</>
          : 'A steady force gives a rectangle, so W is simply force × distance.'}
      </p>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="situation">
        <span className="lab-field-row">
          <Chip selected={spring} onClick={() => setMode('spring')}>spring (F = kx)</Chip>
          <Chip selected={!spring} onClick={() => setMode('constant')}>constant force</Chip>
        </span>
      </Field>
      {spring ? (
        <Field label="spring constant k" value={`${k} N/m`}><Slider value={k} min={1} max={6} step={0.5} onChange={setK} ariaLabel="spring constant" /></Field>
      ) : (
        <Field label="force F" value={`${force} N`}><Slider value={force} min={2} max={14} step={1} onChange={setForce} ariaLabel="force" /></Field>
      )}
      <Field label="distance x" value={`${x.toFixed(1)} m`}><Slider value={x} min={0} max={X_MAX} step={0.1} onChange={setX} ariaLabel="distance pulled" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
