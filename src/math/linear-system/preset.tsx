'use client';

/**
 * LinearSystemLab — two unknowns, two clues, one answer. Each equation is drawn
 * as a LINE: every point on it is an (x, y) pair that obeys that clue. The ONE
 * point that obeys BOTH clues is where the lines cross — the solution to the
 * system. The learner drags a marker to find it; live ✓/✗ tells them whether the
 * point currently satisfies each clue, so the crossing is "where both go green".
 *
 * SVG <Stage> + Plot + a draggable MovableDot — accessible, theme-aware, on the
 * same engine as every other lab. (Lines in slope-intercept y = m·x + b; the
 * intersection is solved exactly.)
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Dot, MovableDot } from '@classytic/stage';
import { StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

const snap = (v: number): number => Math.round(v * 2) / 2; // half-unit grid

export interface SystemLine { m: number; b: number; label?: string; color?: string }

export interface LinearSystemProps {
  /** Two lines y = m·x + b. They must not be parallel. */
  lines?: [SystemLine, SystemLine];
  xRange?: [number, number];
  yRange?: [number, number];
  title?: string;
  prompt?: string;
  height?: number;
}

const DEFAULT_LINES: [SystemLine, SystemLine] = [
  { m: 1, b: 1, label: 'clue A', color: 'var(--stage-accent)' },
  { m: -1, b: 5, label: 'clue B', color: 'var(--stage-accent-2)' },
];

export function LinearSystemLab({
  lines = DEFAULT_LINES,
  xRange = [-1, 7],
  yRange = [-1, 7],
  title = 'Two unknowns, one answer',
  prompt = 'Drag the point to where BOTH lines cross — that (x, y) obeys both clues.',
  height = 360,
}: LinearSystemProps = {}): ReactNode {
  const [l1, l2] = lines;
  // exact intersection: m1·x + b1 = m2·x + b2
  const sol = useMemo(() => {
    const dm = l1.m - l2.m;
    if (Math.abs(dm) < 1e-9) return null; // parallel — no unique solution
    const x = (l2.b - l1.b) / dm;
    return { x, y: l1.m * x + l1.b };
  }, [l1.m, l1.b, l2.m, l2.b]);

  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const [guess, setGuess] = useState({ x: snap((xMin + xMax) / 2), y: snap((yMin + yMax) / 2) });
  useEffect(() => { setGuess({ x: snap((xMin + xMax) / 2), y: snap((yMin + yMax) / 2) }); }, [xMin, xMax, yMin, yMax]);

  const onLine = (l: SystemLine): boolean => Math.abs(l.m * guess.x + l.b - guess.y) < 1e-6;
  const onA = onLine(l1);
  const onB = onLine(l2);
  const solved = onA && onB;

  useCheckpoint({ solved, activity: 'linear-system' });

  const col1 = l1.color ?? 'var(--stage-accent)';
  const col2 = l2.color ?? 'var(--stage-accent-2)';

  const figure = (
    <Stage view={{ xMin, xMax, yMin, yMax }} height={height} ariaLabel={`Two lines on a grid; drag the point to their crossing. Currently (${guess.x}, ${guess.y}).`}>
        <Grid />
        <Axes labels />
        <Plot.OfX y={(x) => l1.m * x + l1.b} domain={[xMin, xMax]} color={col1} weight={3} />
        <Plot.OfX y={(x) => l2.m * x + l2.b} domain={[xMin, xMax]} color={col2} weight={3} />
        {solved && sol && <Dot x={sol.x} y={sol.y} r={9} color="var(--stage-good)" opacity={0.3} />}
        <MovableDot
          value={guess}
          onMove={(p) => setGuess({ x: clamp(snap(p.x), xMin, xMax), y: clamp(snap(p.y), yMin, yMax) })}
          color={solved ? 'var(--stage-good)' : 'var(--stage-fg)'}
          ariaLabel="your (x, y) guess"
        />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>(x, y) = ({guess.x}, {guess.y})</span>
      <span style={{ color: onA ? 'var(--stage-good)' : 'var(--stage-muted)' }}>{onA ? '✓' : '○'} {l1.label ?? 'line A'}</span>
      <span style={{ color: onB ? 'var(--stage-good)' : 'var(--stage-muted)' }}>{onB ? '✓' : '○'} {l2.label ?? 'line B'}</span>
      <StatusPill ok={solved}>{solved ? `✓ Solved: x=${guess.x}, y=${guess.y}` : 'Not the crossing yet'}</StatusPill>
    </ControlBar>
  );

  const footer = (
    <LiveRegion>
      {solved ? `Solved: x ${guess.x}, y ${guess.y}` : `Point at ${guess.x}, ${guess.y}; on ${l1.label ?? 'A'}: ${onA}; on ${l2.label ?? 'B'}: ${onB}`}
    </LiveRegion>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} footer={footer}>{figure}</LabFrame>;
}
