'use client';

/**
 * Math-coordinate ADAPTERS over the canonical pixel-space electronics glyph library
 * (kit/electronics). A lab drawing on a math-unit <Stage> places a real schematic
 * symbol by giving a `center` in view units; the adapter projects to pixels and
 * renders the ONE canonical glyph, so there is a single definition of each symbol
 * across every circuit lab. This module carries the electronics dependency, kept out
 * of ./annotations so pure geometry labs don't pull it.
 */

import { Fragment, type ReactNode } from 'react';
import { Label, useCoords, type Vec2 } from '@classytic/stage';
import { ResistorGlyph, CellGlyph, BulbGlyph, SwitchGlyph } from '../electronics/index.js';

export interface ResistorBoxProps {
  /** Center of the resistor, in view units. */
  center: Vec2;
  /** Box width / height in view units. */
  w: number;
  h: number;
  color?: string;
  label?: string;
  /** Optional reading shown below the box (e.g. a voltage drop / branch current). */
  reading?: string;
}

/** Resistor at a math `center`; `w` (units) → body reach, projected to the canonical glyph. */
export function ResistorBox({
  center,
  w,
  color = 'var(--stage-fg)',
  label,
  reading,
  live,
}: ResistorBoxProps & { live?: boolean }): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const half = Math.max(c.sx(w / 2), 24);
  return (
    <Fragment>
      <ResistorGlyph cx={cx} cy={cy} half={half} live={live} label={label} />
      {reading && <Label x={center.x} y={center.y} text={reading} color={color} size={11} dy={22} />}
    </Fragment>
  );
}

export type GlyphOrient = 'h' | 'v';

/** Rotate a glyph 90° for a vertical wire, keeping its label horizontal (rendered separately). */
function Oriented({
  cx,
  cy,
  orient,
  label,
  glyph,
}: {
  cx: number;
  cy: number;
  orient: GlyphOrient;
  label?: string;
  glyph: (showLabel: boolean) => ReactNode;
}): ReactNode {
  if (orient === 'h') return <Fragment>{glyph(true)}</Fragment>;
  return (
    <Fragment>
      <g transform={`rotate(90 ${cx} ${cy})`}>{glyph(false)}</g>
      {label && (
        <text
          x={cx + 16}
          y={cy + 4}
          fill="var(--stage-fg)"
          fontSize={11}
          fontWeight={600}
          textAnchor="start"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </Fragment>
  );
}

/** Cell / battery at a math `center`; `half` (units) → terminal reach. `cells` > 1 = a battery. */
export function CellBox({
  center,
  half,
  live,
  label,
  cells,
  orient = 'h',
}: {
  center: Vec2;
  half: number;
  live?: boolean;
  label?: string;
  cells?: number;
  orient?: GlyphOrient;
}): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const h = Math.max(c.sx(half), 22);
  return (
    <Oriented
      cx={cx}
      cy={cy}
      orient={orient}
      label={label}
      glyph={(s) => (
        <CellGlyph cx={cx} cy={cy} half={h} live={live} label={s ? label : undefined} cells={cells} />
      )}
    />
  );
}

/** Filament lamp at a math `center`; `brightness` 0..1 glows it. */
export function BulbBox({
  center,
  half,
  live,
  brightness,
  label,
  orient = 'h',
}: {
  center: Vec2;
  half: number;
  live?: boolean;
  brightness?: number;
  label?: string;
  orient?: GlyphOrient;
}): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const h = Math.max(c.sx(half), 22);
  return (
    <Oriented
      cx={cx}
      cy={cy}
      orient={orient}
      label={label}
      glyph={(s) => (
        <BulbGlyph
          cx={cx}
          cy={cy}
          half={h}
          live={live}
          brightness={brightness}
          label={s ? label : undefined}
        />
      )}
    />
  );
}

/** SPST switch at a math `center`; `closed` lays the lever down. */
export function SwitchBox({
  center,
  half,
  live,
  closed,
  label,
  orient = 'h',
}: {
  center: Vec2;
  half: number;
  live?: boolean;
  closed?: boolean;
  label?: string;
  orient?: GlyphOrient;
}): ReactNode {
  const c = useCoords();
  const [cx, cy] = c.toPx(center.x, center.y);
  const h = Math.max(c.sx(half), 22);
  return (
    <Oriented
      cx={cx}
      cy={cy}
      orient={orient}
      label={label}
      glyph={(s) => (
        <SwitchGlyph cx={cx} cy={cy} half={h} live={live} closed={closed} label={s ? label : undefined} />
      )}
    />
  );
}
