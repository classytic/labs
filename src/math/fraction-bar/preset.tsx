'use client';

/**
 * FractionBarLab, the authorable PART-WHOLE / fraction manipulative: a strip is
 * split into `denom` equal parts and the learner drags to shade `num` of them.
 * The same shaded amount reads as a fraction, a decimal, a percent, and (when a
 * `whole` is set) a concrete quantity, so k/n, 0.75, 75% and "15 of 20" are
 * visibly ONE thing. An optional second strip at a different denominator makes
 * EQUIVALENT fractions (¾ = 6⁄8) something you see by re-cutting the same length.
 *
 * One engine, many uses, all data: set denom, a target to shade, a whole+unit
 * for "fraction of a quantity", or a compare denominator for equivalence. Built
 * on the juiced <MovableDot> (snaps to the cell boundaries, live readout).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, MovableDot } from '@classytic/stage';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { StatusPill } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { getScene } from '../../kit/scenes.js';
import { BarStrip } from '../../kit/bar-strip.js';
import { gcd, round } from '../../core/util.js';

export interface FractionBarProps {
  /** Number of equal parts the whole is cut into. Default 4. */
  denom?: number;
  /** Starting shaded parts. Default 0. */
  num?: number;
  /** Goal numerator; solved when that many parts are shaded. Omit to explore. */
  target?: number;
  /** If set, also show the fraction OF this quantity (k/n × whole). */
  whole?: number;
  unit?: string;
  /** Second strip cut into this many parts, to show the equivalent fraction. */
  compareDenom?: number;
  /** Show the decimal + percent equivalents. Default true. */
  showEquiv?: boolean;
  /** Optional concrete twin (any level scene): the part-whole as a pie / jar / etc. */
  scene?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

export function FractionBarLab(props: FractionBarProps = {}): ReactNode {
  const {
    denom = 4, target, whole, unit = '', compareDenom, showEquiv = true, scene,
    height = 240,
    title = 'Fractions',
    prompt = target != null ? `Shade ${target}/${denom} of the strip.` : 'Drag to shade the strip.',
    activity = 'fraction-bar',
  } = props;
  const n = Math.max(1, Math.round(denom));

  const clampN = (k: number): number => Math.max(0, Math.min(n, Math.round(k)));
  const [num, setNum] = useState(clampN(props.num ?? 0));
  useEffect(() => { setNum(clampN(props.num ?? 0)); }, [props.num, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const solved = target != null && num === target;
  const frac = num / n;
  const g = gcd(num, n);
  const simp = num > 0 && g > 1 ? `${num / g}/${n / g}` : null;
  const fillColor = solved ? 'var(--stage-good)' : 'var(--stage-accent)';

  useCheckpoint({ solved, activity, response: `${num}/${n}` });

  const hasCompare = compareDenom != null && compareDenom > 0;
  const cmpShaded = hasCompare ? Math.round(frac * compareDenom!) : 0;
  const cmpExact = hasCompare ? Math.abs(frac * compareDenom! - cmpShaded) < 1e-9 : false;

  const Y_MAIN = hasCompare ? 0.75 : 0;
  const Y_CMP = -0.95;
  const yMin = hasCompare ? -2.1 : -1.5;
  const yMax = hasCompare ? 1.9 : 1.2;

  const figure = (
    <Stage view={{ xMin: -0.55, xMax: n + 0.55, yMin, yMax }} height={height} preserveAspect={false} pad={14} ariaLabel={`Fraction strip showing ${num} of ${n} parts shaded`}>
      <BarStrip span={n} cells={n} shaded={num} y={Y_MAIN} color={fillColor} />
      {/* target marker */}
      {target != null && !solved && <Segment from={{ x: target, y: Y_MAIN - 0.85 }} to={{ x: target, y: Y_MAIN + 0.85 }} color="var(--stage-good)" weight={1.75} opacity={0.6} dashed />}
      {/* the draggable boundary handle */}
      <MovableDot
        value={{ x: num, y: Y_MAIN }}
        onMove={(p) => setNum(clampN(p.x))}
        constrain="horizontal"
        range={{ min: 0, max: n }}
        snap={1}
        step={1}
        readout={() => `${num}/${n}`}
        color={fillColor}
        r={9}
        ariaLabel="fraction boundary"
      />
      {/* equivalent strip: SAME span as the main strip (so the lengths line up),
          just cut into compareDenom parts. The fraction itself reads in the
          controls bar, not as illegible text painted over the fill. */}
      {hasCompare && <BarStrip span={n} cells={compareDenom!} shaded={cmpShaded} y={Y_CMP} color="var(--stage-accent)" weight={26} />}
    </Stage>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>{num}/{n}</span>
      {hasCompare && cmpShaded > 0 && <span style={{ opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>= {cmpShaded}/{compareDenom}{cmpExact ? '' : ' (≈)'}</span>}
      {simp && <span style={{ opacity: 0.75 }}>= {simp}</span>}
      {showEquiv && <span style={{ opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>= {round(frac)} = {round(frac * 100)}%</span>}
      {whole != null && <span style={{ opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>= {round(frac * whole)}{unit ? ` ${unit}` : ''} of {whole}</span>}
      {target != null && <StatusPill ok={solved}>{solved ? `✓ ${target}/${n}` : `shade ${target}/${n}`}</StatusPill>}
    </ControlBar>
  );

  const twin = scene && scene !== 'none'
    ? getScene(scene)?.render({ frac, guessTone: solved ? 'ok' : 'idle', color: fillColor, label: `${num}/${n}`, width: 132, height: 170 })
    : null;
  const aside = twin ? <div style={{ display: 'grid', placeItems: 'center' }}>{twin}</div> : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside}>{figure}</LabFrame>;
}
