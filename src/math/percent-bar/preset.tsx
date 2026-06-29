'use client';

/**
 * PercentBarLab, the authorable PERCENTAGE manipulative: a bar is the whole
 * (100%), the learner drags a fill to a target percent, and the same drag reads
 * out both the percent AND the concrete amount (percent × whole). One engine,
 * many analogies, the story is data: set `whole` + `unit` (students, mL, $, %
 * battery) and an optional `segments` breakdown for the reference bar, and the
 * SAME component teaches "make 25%", "25% of 80", a budget split, a charged
 * battery, a poll. Built on the juiced <MovableDot> (snap + live readout +
 * ghost stops) so a percentage feels tactile, not typed.
 *
 * Fully authorable: whole, unit, target, snap granularity, the reference-bar
 * segments + their labels/colours, and the prompt, no code per analogy.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Label, Dot, MovableDot } from '@classytic/stage';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { StatusPill } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { getScene } from '../../kit/scenes.js';
import { round } from '../../core/util.js';

export interface PercentSegment {
  /** Share of the whole, 0..1 (segments are normalized together). */
  frac: number;
  label?: string;
  color?: string;
}

export interface PercentBarProps {
  /** The quantity the full bar represents (100%). Default 100. */
  whole?: number;
  /** Unit on the concrete amount, e.g. "students", "mL", "$". */
  unit?: string;
  /** Starting fill in percent (0..100). Default 0. */
  start?: number;
  /** Goal in percent; solved when the fill lands on it. Omit for free explore. */
  target?: number;
  /** Snap granularity in percent. Default 5. */
  snapPct?: number;
  /** Show the concrete amount (percent × whole) alongside the percent. */
  showValue?: boolean;
  /** Optional authored breakdown drawn on a reference bar above the slider. */
  segments?: PercentSegment[];
  /** Caption for the reference bar (e.g. "The class", "Monthly budget"). */
  referenceLabel?: string;
  /** Optional concrete twin of the percentage: any level scene ('pie' | 'battery' |
   *  'jar' | 'balloon' | …). A percentage shown as a pie filling is the obvious one. */
  scene?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const PALETTE = ['var(--stage-accent)', 'var(--stage-good)', '#f3a23b', '#e85aa6', '#7c83ff', '#34c6c6'];
const fmtVal = (n: number): string => String(round(n));

export function PercentBarLab(props: PercentBarProps = {}): ReactNode {
  const {
    whole = 100, unit = '', start = 0, target, snapPct = 5, showValue = true,
    segments, referenceLabel, scene,
    height = 230,
    title = 'Percentages',
    prompt = target != null ? `Drag the bar to ${target}%.` : 'Drag the bar and watch the percentage.',
    activity = 'percent-bar',
  } = props;

  const snap = (p: number): number => Math.round(p / snapPct) * snapPct;
  const clampPct = (p: number): number => Math.max(0, Math.min(100, snap(p)));
  const [pct, setPct] = useState(clampPct(start));
  useEffect(() => { setPct(clampPct(start)); }, [start, snapPct]); // eslint-disable-line react-hooks/exhaustive-deps

  const solved = target != null && pct === target;
  const value = round(whole * pct / 100);
  useCheckpoint({ solved, activity, response: `${pct}%${showValue ? ` = ${fmtVal(value)} ${unit}` : ''}` });

  const fillColor = solved ? 'var(--stage-good)' : 'var(--stage-accent)';
  const Y_REF = 1.35;   // reference bar row
  const Y_BAR = -0.25;  // interactive bar row
  const BARW = 30;      // bar thickness, px

  // normalize authored segments to fractions of the whole
  const segTotal = (segments ?? []).reduce((s, x) => s + Math.max(0, x.frac), 0) || 1;
  let acc = 0;
  const segSpans = (segments ?? []).map((s, i) => {
    const x0 = (acc / segTotal) * 100;
    acc += Math.max(0, s.frac);
    const x1 = (acc / segTotal) * 100;
    return { ...s, x0, x1, mid: (x0 + x1) / 2, color: s.color ?? PALETTE[i % PALETTE.length] };
  });

  const ticks: number[] = [];
  for (let p = 0; p <= 100; p += snapPct) ticks.push(p);

  const figure = (
    <Stage view={{ xMin: -7, xMax: 114, yMin: -2.4, yMax: segments?.length || referenceLabel ? 2.6 : 1.2 }} height={height} preserveAspect={false} pad={14} ariaLabel={`Percentage bar at ${pct} percent of ${whole}${unit ? ' ' + unit : ''}`}>
      {/* reference bar: authored segments, or a single muted whole */}
      {(segSpans.length > 0 || referenceLabel) && (
        <>
          {referenceLabel && <Label x={0} y={Y_REF} text={referenceLabel} color="var(--stage-muted)" size={12} anchor="start" dy={-22} />}
          {segSpans.length > 0
            ? segSpans.map((s, i) => (
                <g key={i}>
                  <Segment from={{ x: s.x0, y: Y_REF }} to={{ x: s.x1, y: Y_REF }} color={s.color} weight={BARW - 4} opacity={0.85} />
                  {s.label && (s.x1 - s.x0) > 9 && <Label x={s.mid} y={Y_REF} text={s.label} color="var(--stage-fg)" size={11} weight={700} />}
                </g>
              ))
            : <Segment from={{ x: 0, y: Y_REF }} to={{ x: 100, y: Y_REF }} color="var(--stage-grid)" weight={BARW - 4} opacity={0.7} />}
        </>
      )}

      {/* interactive bar: track + fill */}
      <Segment from={{ x: 0, y: Y_BAR }} to={{ x: 100, y: Y_BAR }} color="var(--stage-grid)" weight={BARW} opacity={0.6} />
      <Segment from={{ x: 0, y: Y_BAR }} to={{ x: Math.max(0.0001, pct), y: Y_BAR }} color={fillColor} weight={BARW} />

      {/* minor ticks under the bar */}
      {ticks.map((p) => <Segment key={p} from={{ x: p, y: Y_BAR - 0.62 }} to={{ x: p, y: Y_BAR - (p % 25 === 0 ? 0.92 : 0.78) }} color="var(--stage-fg)" opacity={p % 25 === 0 ? 0.5 : 0.2} weight={p % 25 === 0 ? 1.5 : 1} />)}
      <Label x={0} y={Y_BAR} text="0%" color="var(--stage-muted)" size={12} dy={34} />
      <Label x={100} y={Y_BAR} text="100%" color="var(--stage-muted)" size={12} dy={34} />
      <Label x={100} y={Y_BAR} text={`${fmtVal(whole)}${unit ? ' ' + unit : ''}`} color="var(--stage-muted)" size={12} anchor="start" dx={10} />

      {/* target marker */}
      {target != null && (
        <>
          <Segment from={{ x: target, y: Y_BAR - 0.95 }} to={{ x: target, y: Y_BAR + 0.95 }} color="var(--stage-good)" weight={1.75} opacity={solved ? 0.9 : 0.55} dashed />
          {!solved && <Dot x={target} y={Y_BAR} r={5} color="var(--stage-good)" opacity={0.4} />}
        </>
      )}

      {/* the draggable fill handle */}
      <MovableDot
        value={{ x: pct, y: Y_BAR }}
        onMove={(p) => setPct(clampPct(p.x))}
        constrain="horizontal"
        range={{ min: 0, max: 100 }}
        snap={snapPct}
        step={snapPct}
        readout={() => `${pct}%`}
        color={fillColor}
        r={9}
        ariaLabel="percentage fill handle"
      />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      {showValue && (
        <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>
          = {fmtVal(value)}{unit ? ` ${unit}` : ''}{whole !== 100 ? ` of ${fmtVal(whole)}` : ''}
        </span>
      )}
      {target != null && <StatusPill ok={solved}>{solved ? `✓ ${target}%` : `target ${target}%`}</StatusPill>}
    </ControlBar>
  );

  // optional concrete twin: the same percentage as a pie / battery / jar, filling live
  const twin = scene && scene !== 'none'
    ? getScene(scene)?.render({ frac: pct / 100, guessTone: solved ? 'ok' : 'idle', color: fillColor, label: `${pct}%`, width: 132, height: 170 })
    : null;
  const aside = twin ? <div style={{ display: 'grid', placeItems: 'center' }}>{twin}</div> : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside}>{figure}</LabFrame>;
}
