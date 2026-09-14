'use client';

/**
 * BoundsWindowLab — what a rounded measurement does to a DIVISION.
 *
 * Bounds are taught as a rule and lost as a rule: students learn that 12 cm to the nearest
 * centimetre means 11.5 to 12.5, then meet "find the greatest possible speed" and reach for the
 * two upper bounds, because that is what worked for an area. For a quotient the denominator goes
 * the OTHER way, and no amount of restating the rule fixes it. Watching it is what fixes it.
 *
 * So both measurements are drawn as their own window, each marker free inside it, and the quotient
 * is recomputed live. Drag the top marker right and the answer grows; drag the bottom marker right
 * and the answer shrinks. The greatest quotient is at top-right and bottom-LEFT, and the learner
 * arrives there by pushing until the number stops growing rather than by being told.
 *
 * Each window is drawn from 0 to 1 rather than to scale. A distance window of 10 m beside a time
 * window of 1 s would otherwise render as one long bar and one dot, and the comparison being made
 * here is between the two EDGES of each window, not between their sizes.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Dot, Label, MovableDot } from '@classytic/stage';
import { Activity } from '../../kit/activity.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

/** Trim a computed value to something a learner would write down. */
function show(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const r = Math.round(v * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, '');
}

export interface BoundsWindowProps {
  /** The measurement written on the page, before anyone asks how it was rounded. */
  numerator?: number;
  /** The rounding unit: 10 means "to the nearest 10", so the window is plus or minus 5. */
  numeratorUnit?: number;
  numeratorLabel?: string;
  numeratorSymbol?: string;
  denominator?: number;
  denominatorUnit?: number;
  denominatorLabel?: string;
  denominatorSymbol?: string;
  resultLabel?: string;
  resultSymbol?: string;
  /** Which extreme the learner is asked to reach. */
  goal?: 'max' | 'min';
  title?: string;
  prompt?: string;
  height?: number;
}

/** Twenty stops across a window: fine enough to feel continuous, coarse enough to land on an edge. */
const STOPS = 20;

export function BoundsWindowLab({
  numerator = 120,
  numeratorUnit = 10,
  numeratorLabel = 'Distance',
  numeratorSymbol = 'm',
  denominator = 16,
  denominatorUnit = 1,
  denominatorLabel = 'Time',
  denominatorSymbol = 's',
  resultLabel = 'Speed',
  resultSymbol = 'm/s',
  goal = 'max',
  title = 'Bounds through a division',
  prompt = 'Drag each marker inside its window. Find the greatest possible answer.',
  height = 300,
}: BoundsWindowProps = {}): ReactNode {
  const nLow = numerator - numeratorUnit / 2;
  const nHigh = numerator + numeratorUnit / 2;
  const dLow = denominator - denominatorUnit / 2;
  const dHigh = denominator + denominatorUnit / 2;

  // Position is held as a fraction of each window, so the two rows share one geometry.
  const [nt, setNt] = useState(0.5);
  const [dt, setDt] = useState(0.5);
  useEffect(() => {
    setNt(0.5);
    setDt(0.5);
  }, [numerator, numeratorUnit, denominator, denominatorUnit]);

  const nVal = nLow + nt * (nHigh - nLow);
  const dVal = dLow + dt * (dHigh - dLow);
  const result = dVal === 0 ? Number.NaN : nVal / dVal;

  const extreme = useMemo(() => {
    const best = goal === 'max' ? nHigh / dLow : nLow / dHigh;
    return best;
  }, [goal, nHigh, nLow, dHigh, dLow]);

  // "At the edge" rather than an exact compare: the marker snaps to stops, and a learner who has
  // pushed it as far as it goes has understood the point whether or not the float agrees.
  const atEdge = (t: number, want: 0 | 1): boolean => Math.abs(t - want) < 1 / (STOPS * 2);
  const solved =
    goal === 'max' ? atEdge(nt, 1) && atEdge(dt, 0) : atEdge(nt, 0) && atEdge(dt, 1);
  useCheckpoint({ solved, activity: 'bounds-window' });

  const snapT = (x: number): number => clamp(Math.round(x * STOPS) / STOPS, 0, 1);

  /** One window: the bar, its two edge values, and the draggable marker. */
  const row = (
    y: number,
    t: number,
    setT: (v: number) => void,
    low: number,
    high: number,
    label: string,
    symbol: string,
    wantEdge: 0 | 1,
  ): ReactNode => {
    const onTarget = atEdge(t, wantEdge);
    return (
      <>
        <Label x={-0.3} y={y} text={label} color="var(--stage-muted)" size={12} dy={-14} />
        <Segment
          from={{ x: 0, y }}
          to={{ x: 1, y }}
          color="var(--stage-accent)"
          opacity={0.25}
          weight={14}
        />
        {/* The edge that makes this side of the fraction extreme, lit only once reached. */}
        <Segment
          from={{ x: wantEdge, y: y - 0.2 }}
          to={{ x: wantEdge, y: y + 0.2 }}
          color="var(--stage-good)"
          opacity={onTarget ? 0.9 : 0.3}
          weight={3}
        />
        <Label x={0} y={y} text={show(low)} color="var(--stage-muted)" size={11} dy={26} />
        <Label x={1} y={y} text={show(high)} color="var(--stage-muted)" size={11} dy={26} />
        <Label
          x={t}
          y={y}
          text={`${show(low + t * (high - low))} ${symbol}`}
          color="var(--stage-fg)"
          size={13}
          dy={-24}
        />
        <MovableDot
          value={{ x: t, y }}
          onMove={(p) => setT(snapT(p.x))}
          constrain="horizontal"
          range={{ min: 0, max: 1 }}
          snap={1 / STOPS}
          step={1 / STOPS}
          color={onTarget ? 'var(--stage-good)' : 'var(--stage-accent)'}
          ariaLabel={`${label} within its window`}
        />
      </>
    );
  };

  const figure = (
    <Stage
      view={{ xMin: -0.42, xMax: 1.18, yMin: -1.5, yMax: 1.5 }}
      height={height}
      preserveAspect={false}
      ariaLabel={`${numeratorLabel} between ${show(nLow)} and ${show(nHigh)}, ${denominatorLabel} between ${show(dLow)} and ${show(dHigh)}, giving ${resultLabel} ${show(result)}`}
    >
      {row(0.75, nt, setNt, nLow, nHigh, numeratorLabel, numeratorSymbol, goal === 'max' ? 1 : 0)}
      {/* The division bar, so the two rows read as one fraction rather than two sliders. */}
      <Segment
        from={{ x: -0.02, y: 0 }}
        to={{ x: 1.02, y: 0 }}
        color="var(--stage-fg)"
        opacity={0.55}
        weight={2}
      />
      <Label
        x={1.1}
        y={0}
        text={`= ${show(result)}`}
        color={solved ? 'var(--stage-good)' : 'var(--stage-fg)'}
        size={15}
      />
      {row(-0.75, dt, setDt, dLow, dHigh, denominatorLabel, denominatorSymbol, goal === 'max' ? 0 : 1)}
      {solved && <Dot x={1.1} y={0} r={13} color="var(--stage-good)" opacity={0.22} />}
    </Stage>
  );

  const aim = goal === 'max' ? 'greatest' : 'least';

  return (
    <Activity.Root className="math-bounds-window-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Limits of accuracy" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{solved ? `${aim === 'greatest' ? 'Greatest' : 'Least'} value found` : `Find the ${aim} value`}</strong>
        <span>
          {resultLabel} {show(result)} {resultSymbol}
        </span>
        {/* The target value appears only after it is reached. Printing it up front turns a lab
            about pushing each bound the right way into a number to copy. */}
        {solved ? (
          <span>
            {aim} {show(extreme)}
          </span>
        ) : null}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Two measurement windows over a division">{figure}</Activity.Canvas>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{solved ? 'Complete' : 'Observe'}</span>
        <div>
          {solved
            ? `The ${aim} value uses the ${goal === 'max' ? 'upper' : 'lower'} bound on top and the ${goal === 'max' ? 'lower' : 'upper'} bound underneath. The two bounds go opposite ways.`
            : 'Moving the top marker right makes the answer grow. Moving the bottom marker right makes it shrink.'}
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {`${numeratorLabel} ${show(nVal)}, ${denominatorLabel} ${show(dVal)}, ${resultLabel} ${show(result)}`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{solved ? 'Both bounds correct' : 'Drag both markers'}</strong>
          <span>
            {resultLabel} {show(result)} {resultSymbol}
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
