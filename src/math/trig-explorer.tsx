'use client';

/**
 * TrigExplorer, the unit circle ↔ sine wave connection (3Blue1Brown style),
 * but interactive: drag the angle (or press play) and watch sin/cos trace out.
 *
 * Now on the @classytic/stage engine (SVG, accessible, themed), the unit circle,
 * radius, projections, and unrolled wave are real primitives, the angle handle is
 * a `MovableDot` (keyboard + aria), and animation runs on the engine clock.
 *
 * Deliberately FOCUSED on one idea, "sin and cos are the shadows of a point
 * going around a circle." Plotting arbitrary trig (tan, y=a·sin(b·x), …) is the
 * job of the general `Grapher`; this widget stays clean. Configurable only in
 * which of sin/cos to show.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Circle, Segment, Vector, Polyline, Dot, MovableDot, useFrameLoop, useInView, type Vec2 } from '@classytic/stage';
import { CheckButton } from '../kit/controls.js';
import { LabFrame, ControlBar } from '../kit/frame.js';
import { Tex } from '../core/tex.js';
import { toRad, toDeg } from '../core/util.js';

const TWO_PI = Math.PI * 2;
const VIEW = { xMin: -1.5, xMax: 5, yMin: -1.4, yMax: 1.4 };
const WAVE_X0 = 1.5; // where the unrolled wave starts (math x)
const WAVE_W = 3.3; // wave width in math x for a full 2π

const waveX = (theta: number): number => WAVE_X0 + (theta / TWO_PI) * WAVE_W;

/** The two projections this widget visualizes. */
export type TrigFn = 'sin' | 'cos';
export const TRIG_FNS: readonly TrigFn[] = ['sin', 'cos'];

const FN_COLOR: Record<TrigFn, string> = { sin: 'var(--stage-accent)', cos: 'var(--stage-good)' };
const FN_EVAL: Record<TrigFn, (t: number) => number> = { sin: Math.sin, cos: Math.cos };

function normalizeFns(input: TrigExplorerProps['functions']): TrigFn[] {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : null;
  const picked = (raw ?? [])
    .map((s) => String(s).trim().toLowerCase())
    .filter((s): s is TrigFn => (TRIG_FNS as readonly string[]).includes(s));
  return picked.length ? Array.from(new Set(picked)) : ['sin', 'cos'];
}

interface TrigExplorerProps {
  /** Which projections to show. Default `['sin','cos']`. */
  functions?: TrigFn[] | string;
  /** Initial angle in degrees. Default 30. */
  startDeg?: number;
}

export function TrigExplorer({ functions, startDeg = 30 }: TrigExplorerProps = {}): ReactNode {
  const fns = normalizeFns(functions);
  const [theta, setTheta] = useState(toRad(startDeg));
  const [playing, setPlaying] = useState(false);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  useEffect(() => { setTheta(toRad(startDeg)); }, [startDeg]);

  useFrameLoop((f) => { setTheta((prev) => (prev + (f.dtMs / 1000) * 0.9) % TWO_PI); }, { running: playing && inView });

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // unrolled waves (0..theta), sampled
  const waveOf = (fn: TrigFn): Vec2[] => {
    const pts: Vec2[] = [];
    for (let a = 0; a <= theta + 1e-6; a += TWO_PI / 240) pts.push({ x: waveX(a), y: FN_EVAL[fn](a) });
    pts.push({ x: waveX(theta), y: FN_EVAL[fn](theta) });
    return pts;
  };

  const lead = fns[0] ?? 'sin';
  const deg = toDeg(theta);

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
    <Stage view={VIEW} height={320} ariaLabel={`Unit circle and unrolled ${fns.join(' & ')} wave at θ = ${deg.toFixed(0)} degrees`}>
        <Grid />
        <Axes />
        {/* unit circle */}
        <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-fg)" opacity={0.3} weight={1.5} />
        {/* projections on the circle */}
        {fns.includes('cos') && <Segment from={{ x: 0, y: 0 }} to={{ x: cosT, y: 0 }} color={FN_COLOR.cos} weight={2.5} />}
        {fns.includes('sin') && <Segment from={{ x: cosT, y: sinT }} to={{ x: cosT, y: 0 }} color={FN_COLOR.sin} weight={2.5} dashed />}
        {/* unrolled waves + their front dots */}
        {fns.map((fn) => <Polyline key={fn} points={waveOf(fn)} color={FN_COLOR[fn]} weight={2.5} />)}
        {fns.map((fn) => <Dot key={`d-${fn}`} x={waveX(theta)} y={FN_EVAL[fn](theta)} r={3.5} color={FN_COLOR[fn]} />)}
        {/* connector from circle to the lead wave front */}
        <Segment from={{ x: cosT, y: lead === 'cos' ? 0 : sinT }} to={{ x: waveX(theta), y: FN_EVAL[lead](theta) }} color="var(--stage-fg)" opacity={0.4} weight={1} dashed />
        {/* radius + draggable angle handle */}
        <Vector tail={{ x: 0, y: 0 }} tip={{ x: cosT, y: sinT }} color="var(--stage-fg)" weight={2} />
        <MovableDot
          value={{ x: cosT, y: sinT }}
          onMove={(p) => { setPlaying(false); let a = Math.atan2(p.y, p.x); if (a < 0) a += TWO_PI; setTheta(a); }}
          color="var(--stage-fg)"
          ariaLabel="angle on the unit circle"
        />
    </Stage>
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</CheckButton>
      <button type="button" className="lab-chip" onClick={() => { setPlaying(false); setTheta(toRad(startDeg)); }}>Reset</button>
      <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 16, fontVariantNumeric: 'tabular-nums' }}>
        <span><Tex tex={`\\theta\\ ${deg.toFixed(0)}^\\circ`} /></span>
        {fns.map((fn) => <span key={fn} style={{ color: FN_COLOR[fn] }}><Tex tex={`\\${fn}\\theta\\ ${FN_EVAL[fn](theta).toFixed(2)}`} /></span>)}
      </span>
    </ControlBar>
  );

  return (
    <LabFrame
      title="Trig Explorer"
      prompt="Drag the angle on the circle (or press play), sin and cos are just its shadows."
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
