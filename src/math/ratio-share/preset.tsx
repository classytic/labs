'use client';

/**
 * RatioShareLab, the authorable "share in a ratio" manipulative: a quantity is a
 * single bar, and the learner drags ONE divider to split it in the ratio a:b.
 * The split reads back live as an amount AND as a ratio that simplifies, so
 * "share £60 in 2:3" becomes a thing you slide until 24:36 clicks to 2:3. The
 * target divider is shown faint; landing on any split whose simplified ratio is
 * a:b solves it (so 40:60 and 2:3 are visibly the same share).
 *
 * One engine, many uses, all data: set the ratio a:b, the total, the unit and
 * the two side labels. Built on the juiced <MovableDot>.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Label, MovableDot } from '@classytic/stage';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { StatusPill } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { getScene } from '../../kit/scenes.js';
import { gcd, round } from '../../core/util.js';

export interface RatioShareProps {
  /** Ratio parts a : b. Defaults 2 : 3. */
  a?: number;
  b?: number;
  /** The quantity being shared. Default 100. */
  total?: number;
  unit?: string;
  labelA?: string;
  labelB?: string;
  /** Drag step for the divider, in units of the total. Default 1. */
  step?: number;
  /** Optional concrete twin (any level scene): share A as a pie / jar slice / etc. */
  scene?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

export function RatioShareLab(props: RatioShareProps = {}): ReactNode {
  const {
    a = 2, b = 3, total = 100, unit = '', labelA = 'A', labelB = 'B', step = 1, scene,
    height = 220,
    title = 'Share in a ratio',
    prompt = `Share ${total}${unit ? ' ' + unit : ''} in the ratio ${a} : ${b}. Drag the divider.`,
    activity = 'ratio-share',
  } = props;

  const correct = total * a / (a + b);
  const clamp = (v: number): number => Math.max(0, Math.min(total, Math.round(v / step) * step));
  const [split, setSplit] = useState(clamp(props.total != null ? 0 : 0));
  useEffect(() => { setSplit(0); }, [total, a, b, step]);

  const rest = total - split;
  // solved when the simplified split:rest equals the simplified a:b
  const tg = gcd(a, b);
  const sg = gcd(split, rest);
  const solved = split > 0 && rest > 0 && split / sg === a / tg && rest / sg === b / tg;
  const colA = solved ? 'var(--stage-good)' : 'var(--stage-accent)';
  const colB = solved ? '#34c6c6' : '#e85aa6';

  useCheckpoint({ solved, activity, response: `${split} : ${rest}` });

  const figure = (
    <Stage view={{ xMin: -total * 0.04, xMax: total * 1.12, yMin: -1.7, yMax: 1.5 }} height={height} preserveAspect={false} pad={14} ariaLabel={`A bar of ${total} split into ${split} and ${rest}`}>
      {/* the two shares */}
      <Segment from={{ x: 0, y: 0 }} to={{ x: Math.max(0.0001, split), y: 0 }} color={colA} weight={34} />
      <Segment from={{ x: split, y: 0 }} to={{ x: total, y: 0 }} color={colB} weight={34} opacity={0.92} />
      {/* amounts inside each share */}
      {split > total * 0.06 && <Label x={split / 2} y={0} text={`${round(split)}`} color="var(--stage-fg)" size={13} weight={700} />}
      {rest > total * 0.06 && <Label x={(split + total) / 2} y={0} text={`${round(rest)}`} color="var(--stage-fg)" size={13} weight={700} />}
      {/* side labels */}
      <Label x={0} y={0} text={labelA} color="var(--stage-muted)" size={12} anchor="start" dy={32} />
      <Label x={total} y={0} text={labelB} color="var(--stage-muted)" size={12} anchor="end" dy={32} />
      {/* target divider */}
      <Segment from={{ x: correct, y: -0.85 }} to={{ x: correct, y: 0.85 }} color="var(--stage-good)" weight={1.75} opacity={solved ? 0.9 : 0.5} dashed />
      {/* draggable divider */}
      <MovableDot
        value={{ x: split, y: 0 }}
        onMove={(p) => setSplit(clamp(p.x))}
        constrain="horizontal"
        range={{ min: 0, max: total }}
        snap={step}
        step={step}
        readout={() => `${round(split)} : ${round(rest)}`}
        color="var(--stage-fg)"
        r={9}
        ariaLabel="ratio divider"
      />
    </Stage>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{round(split)} : {round(rest)}</span>
      {split > 0 && rest > 0 && <span style={{ opacity: 0.75 }}>= {round(split / sg)} : {round(rest / sg)}</span>}
      <StatusPill ok={solved}>{solved ? `✓ ${a} : ${b}` : `target ${a} : ${b}`}</StatusPill>
    </ControlBar>
  );

  const twin = scene && scene !== 'none'
    ? getScene(scene)?.render({ frac: total > 0 ? split / total : 0, guessTone: solved ? 'ok' : 'idle', color: colA, label: `${labelA}: ${round(split)}`, width: 132, height: 170 })
    : null;
  const aside = twin ? <div style={{ display: 'grid', placeItems: 'center' }}>{twin}</div> : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside}>{figure}</LabFrame>;
}
