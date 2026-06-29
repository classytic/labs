'use client';

/**
 * NumberLineLab, see a number's place, including BELOW zero. A horizontal line
 * with a draggable marker that snaps to integers; optionally pose a target
 * ("drag to where x lands") so the learner discovers that taking away more than
 * you have lands you left of zero, a negative. Reusable for integers,
 * inequalities, and the "owing weight" intuition.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Dot, Label, MovableDot } from '@classytic/stage';
import { StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

const snap = (v: number): number => Math.round(v);

export interface NumberLineProps {
  min?: number;
  max?: number;
  start?: number;
  /** If set, the learner must land the marker here (e.g. the solution −3). */
  target?: number;
  title?: string;
  prompt?: string;
  height?: number;
}

export function NumberLineLab({
  min = -8,
  max = 8,
  start = 0,
  target,
  title = 'Number line',
  prompt = 'Drag the marker along the line.',
  height = 200,
}: NumberLineProps = {}): ReactNode {
  const [val, setVal] = useState(clamp(snap(start), min, max));
  useEffect(() => { setVal(clamp(snap(start), min, max)); }, [start, min, max]);

  const solved = target != null && val === target;
  useCheckpoint({ solved, activity: 'number-line' });

  const ticks = useMemo(() => { const t: number[] = []; for (let i = min; i <= max; i++) t.push(i); return t; }, [min, max]);
  const span = max - min;
  const markerColor = solved ? 'var(--stage-good)' : 'var(--stage-accent)';

  const figure = (
    <Stage view={{ xMin: min - 0.8, xMax: max + 0.8, yMin: -1.3, yMax: 1.3 }} height={height} preserveAspect={false} ariaLabel={`Number line from ${min} to ${max}; marker at ${val}`}>
        {/* the negative half, gently tinted so "below zero" reads as its own territory */}
        <Segment from={{ x: min, y: 0 }} to={{ x: 0, y: 0 }} color="var(--stage-danger)" opacity={0.22} weight={9} />
        <Segment from={{ x: min, y: 0 }} to={{ x: max, y: 0 }} color="var(--stage-fg)" opacity={0.6} weight={2} />
        {ticks.map((t) => <Segment key={`t${t}`} from={{ x: t, y: t === 0 ? -0.26 : -0.16 }} to={{ x: t, y: t === 0 ? 0.26 : 0.16 }} color="var(--stage-fg)" opacity={t === 0 ? 0.7 : 0.35} weight={t === 0 ? 2 : 1} />)}
        {ticks.filter((t) => span <= 16 || t % 2 === 0).map((t) => <Label key={`l${t}`} x={t} y={0} text={String(t)} color="var(--stage-muted)" dy={22} size={12} />)}
        {solved && target != null && <Dot x={target} y={0} r={11} color="var(--stage-good)" opacity={0.3} />}
        <MovableDot value={{ x: val, y: 0 }} onMove={(p) => setVal(clamp(snap(p.x), min, max))} constrain="horizontal" range={{ min, max }} snap={1} step={1} color={markerColor} ariaLabel="number-line marker" />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>value = {val}</span>
      {target != null && <StatusPill ok={solved}>{solved ? `✓ Landed on ${target}` : 'Not there yet'}</StatusPill>}
    </ControlBar>
  );

  const footer = (
    <LiveRegion>
      {target != null ? (solved ? `Landed on ${target}` : `Marker at ${val}`) : `Marker at ${val}`}
    </LiveRegion>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} footer={footer}>{figure}</LabFrame>;
}
