'use client';

/**
 * Small scene-level primitives shared by electronics diagrams. These compose the
 * lower-level Wire and Tag vocabulary without owning layout, simulation, or UI.
 */

import type { ReactNode } from 'react';
import { FG, METAL } from './_shared.js';
import { Wire } from './wire.js';
import { Tag } from './_shared.js';

export interface BreadboardSurfaceProps {
  x: number;
  y: number;
  width: number;
  height: number;
  trenchY: number;
}

/** Quiet solderless-breadboard field: sockets establish scale without competing with wires. */
export function BreadboardSurface({ x, y, width, height, trenchY }: BreadboardSurfaceProps): ReactNode {
  const columns = Math.max(2, Math.floor(width / 24));
  const socketRows = [trenchY - 48, trenchY - 30, trenchY + 30, trenchY + 48];
  return (
    <g aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill="color-mix(in oklab, var(--stage-bg) 92%, var(--stage-muted))"
        stroke="color-mix(in oklab, var(--stage-muted) 28%, transparent)"
      />
      <rect
        x={x + 12}
        y={trenchY - 9}
        width={width - 24}
        height={18}
        rx={4}
        fill="color-mix(in oklab, var(--stage-muted) 10%, transparent)"
      />
      {socketRows.flatMap((row) =>
        Array.from({ length: columns }, (_, index) => (
          <circle
            key={`${row}-${index}`}
            cx={x + 15 + index * ((width - 30) / Math.max(1, columns - 1))}
            cy={row}
            r={1.7}
            fill="color-mix(in oklab, var(--stage-muted) 35%, transparent)"
          />
        )),
      )}
    </g>
  );
}

export interface SupplyRailProps {
  from: [number, number];
  to: [number, number];
  /** Complete visible label, for example "VDD 5 V" or "GND". */
  label: string;
  live?: boolean;
  color?: string;
  labelAt?: [number, number];
  labelAnchor?: 'start' | 'middle' | 'end';
}

/** A labelled power rail. Geometry stays with the lab; electrical state stays token-driven. */
export function SupplyRail({
  from,
  to,
  label,
  live,
  color,
  labelAt = [to[0] + 6, to[1] + 4],
  labelAnchor = 'start',
}: SupplyRailProps): ReactNode {
  return (
    <g role="group" aria-label={`${label} supply rail${live ? ', energized' : ''}`}>
      <Wire points={[from, to]} live={live} color={color} />
      <Tag
        x={labelAt[0]}
        y={labelAt[1]}
        text={label}
        color={color ?? (live ? 'var(--stage-live)' : 'var(--stage-muted)')}
        size={11}
        weight={700}
        anchor={labelAnchor}
      />
    </g>
  );
}

export interface LogicPortProps {
  x: number;
  y: number;
  name: string;
  value: '0' | '1' | '?';
  color?: string;
  side?: 'left' | 'right';
  /** Optional analog reading shown below the digital state. */
  reading?: string;
}

export interface VoltagePortProps {
  x: number;
  y: number;
  name: string;
  reading: string;
  side?: 'left' | 'right';
  color?: string;
}

/**
 * An analog voltage test point. The open ring deliberately differs from the
 * filled LogicPort and from moving current dots: voltage is a potential at a
 * node, not something flowing through the wire.
 */
export function VoltagePort({
  x,
  y,
  name,
  reading,
  side = 'right',
  color = 'var(--stage-charge)',
}: VoltagePortProps): ReactNode {
  const anchor = side === 'right' ? 'start' : 'end';
  const labelX = x + (side === 'right' ? 8 : -8);
  return (
    <g role="group" aria-label={`${name}, ${reading}`}>
      <circle cx={x} cy={y} r={4.5} fill="var(--stage-bg)" stroke={color} strokeWidth={2} />
      <Tag x={labelX} y={y - 7} text={name} color={FG} size={10} weight={700} anchor={anchor} />
      <Tag x={labelX} y={y + 10} text={reading} color={color} size={11} weight={750} anchor={anchor} />
    </g>
  );
}

/** A labelled logic terminal with one consistent state marker and optional voltage reading. */
export function LogicPort({
  x,
  y,
  name,
  value,
  color = value === '1' ? 'var(--stage-good)' : value === '?' ? 'var(--stage-danger)' : METAL,
  side = 'right',
  reading,
}: LogicPortProps): ReactNode {
  const anchor = side === 'right' ? 'start' : 'end';
  const labelX = x + (side === 'right' ? 8 : -8);
  return (
    <g
      role="group"
      aria-label={`${name}, logic ${value === '?' ? 'invalid' : value}${reading ? `, ${reading}` : ''}`}
    >
      <circle cx={x} cy={y} r={4.5} fill={color} stroke={FG} strokeWidth={0.75} />
      <Tag x={labelX} y={y - 8} text={name} color={FG} size={11} weight={700} anchor={anchor} />
      <Tag x={labelX} y={y + 10} text={value} color={color} size={13} weight={800} anchor={anchor} />
      {reading && (
        <Tag
          x={labelX}
          y={y + 27}
          text={reading}
          color="var(--stage-muted)"
          size={10}
          weight={650}
          anchor={anchor}
        />
      )}
    </g>
  );
}
