'use client';

/**
 * PredictPlot, the shared "plot the next point" primitive, the move that makes a
 * function lesson feel like Brilliant instead of a textbook. The graph shows a few
 * GIVEN data points and the learner DRAGS a ghost point to predict the next one;
 * it snaps to the grid and a dashed crosshair reads it off the axes. The pattern is
 * data → rule (discover +5 per marble), not rule → data (type an equation, watch a
 * curve), which is what every existing plotter does.
 *
 * Controlled on purpose: the parent owns the guess so a CONCRETE twin (see <Vessel>)
 * can mirror it live, the whole point of a linked dual representation. The parent also
 * owns correctness and passes `tone` (the ghost goes green on a match); PredictPlot
 * stays a pure, reusable view. Reuse it for any concrete→graph lab: filling rates,
 * unit price, savings over time, displacement, …
 */

import type { ReactNode } from 'react';
import { Point, Segment, Label, MovableDot, type Vec2 } from '@classytic/stage';
import { CoordPlane } from './coords.js';
import type { GuessTone } from './vessel.js';

const TONE_COLOR: Record<GuessTone, string> = {
  idle: 'var(--stage-accent)',
  ok: 'var(--stage-good)',
  no: 'var(--stage-warn)',
};

export interface PredictPlotProps {
  /** Given data points, already plotted (the pattern to extend). */
  data: Vec2[];
  /** The controlled ghost point the learner drags. */
  guess: Vec2;
  onGuess: (p: Vec2, phase: 'move' | 'commit') => void;
  /** Colour the ghost by correctness (parent decides). */
  tone?: GuessTone;
  /** First-quadrant window; axes sit at the corner. */
  xMax: number;
  yMax: number;
  xStep?: number;
  yStep?: number;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  /** Lock the ghost to its x (vertical drag only). Default true , predict the y. */
  lockX?: boolean;
  /** Snap the ghost to the grid on drag. Default true. */
  snap?: boolean;
  /** Draw the underlying rule line y = slope·x + intercept (e.g. once solved). */
  rule?: { slope: number; intercept: number } | null;
  /** Faint guide column at x = guess.x so the learner sees which input they're on. */
  showColumn?: boolean;
  /** Readout the guess coordinate as a label by the ghost. */
  readout?: boolean;
}

const C_DATA = 'var(--stage-fg)';
const C_GRID = 'var(--stage-muted)';

export function PredictPlot({
  data, guess, onGuess, tone = 'idle', xMax, yMax, xStep = 1, yStep, xLabel, yLabel,
  height = 340, lockX = true, snap = true, rule = null, showColumn = true, readout = true,
}: PredictPlotProps): ReactNode {
  const yS = yStep ?? Math.max(1, Math.round(yMax / 8));
  // small negative gutters so the origin sits just off the corner and edge labels breathe.
  const view = { xMin: -xMax * 0.04, xMax: xMax * 1.04, yMin: -yMax * 0.06, yMax: yMax * 1.06 };
  const gColor = TONE_COLOR[tone];

  const snapXY = (p: Vec2): Vec2 => {
    const x = lockX ? guess.x : (snap ? Math.round(p.x / xStep) * xStep : p.x);
    const y = snap ? Math.round(p.y / yS) * yS : p.y;
    return { x, y: Math.max(0, Math.min(yMax, y)), };
  };

  return (
    <CoordPlane
      view={view}
      height={height}
      preserveAspect={false}
      stepX={xStep}
      stepY={yS}
      ariaLabel={`Plot: ${data.length} points given, drag to predict the point at ${xLabel ?? 'x'} = ${guess.x}`}
    >
      {/* axis titles */}
      {yLabel && <Label x={0} y={view.yMax} text={yLabel} dx={6} dy={-2} anchor="start" size={12} weight={700} />}
      {xLabel && <Label x={view.xMax} y={0} text={xLabel} dx={-2} dy={16} anchor="end" size={12} weight={700} />}

      {/* the input column the learner is predicting */}
      {showColumn && (
        <Segment from={{ x: guess.x, y: 0 }} to={{ x: guess.x, y: yMax }} color={C_GRID} weight={1.5} dashed opacity={0.5} />
      )}

      {/* the revealed rule line (e.g. after solving) */}
      {rule && (
        <Segment
          from={{ x: 0, y: rule.intercept }}
          to={{ x: xMax, y: rule.slope * xMax + rule.intercept }}
          color="var(--stage-good)" weight={2} opacity={0.7}
        />
      )}

      {/* given data points */}
      {data.map((d, i) => (
        <Point key={`d${i}`} x={d.x} y={d.y} r={6} color={C_DATA} />
      ))}

      {/* crosshair from the ghost to both axes (read it off) */}
      <Segment from={{ x: guess.x, y: guess.y }} to={{ x: 0, y: guess.y }} color={gColor} weight={1.5} dashed opacity={0.8} />
      {readout && (
        <Label x={0} y={guess.y} text={String(guess.y)} dx={-8} anchor="end" size={11} weight={700} color={gColor} />
      )}

      {/* the draggable ghost */}
      <MovableDot
        value={guess}
        onMove={(p, phase) => onGuess(snapXY(p), phase)}
        constrain={lockX ? 'vertical' : undefined}
        color={gColor}
        r={8}
        step={yS}
        range={{ min: 0, max: yMax }}
        ariaLabel={`your prediction at ${xLabel ?? 'x'} = ${guess.x}, drag up or down to set ${yLabel ?? 'y'}`}
      />
      {guess.y <= 0.001 && (
        <Label x={guess.x} y={0} text="drag up ↑" dx={0} dy={-14} anchor="middle" size={11} weight={700} color={gColor} />
      )}
    </CoordPlane>
  );
}
