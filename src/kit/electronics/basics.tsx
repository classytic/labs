'use client';

/**
 * Basic circuit symbols — the exam-standard passives + source + control:
 * Resistor, Rheostat, Cell/Battery, Switch, Bulb, Capacitor. Each is a pure SVG
 * fragment following the shared authoring contract (see ./index.ts).
 */

import type { ReactNode } from 'react';
import {
  Leads,
  GlyphLabel,
  C_RESISTOR,
  C_BAND,
  C_CELL,
  C_CAP,
  C_SWITCH,
  C_LAMP,
  SHEEN,
  BG,
  FG,
  METAL,
  CHARGE,
  LIVE,
  tint,
  type LeadGlyphProps,
} from './_shared.js';

/**
 * RESISTOR, the IEC/CAIE rectangle (an open box interrupting the wire). The
 * exam-standard symbol; clean token fill + metal outline + a top-edge sheen.
 */
export function ResistorGlyph({ cx, cy, half, live, label, leads = true }: LeadGlyphProps): ReactNode {
  const bw = 22; // body half-width
  const bh = 11; // body half-height
  const body = `color-mix(in oklab, ${C_RESISTOR} 78%, ${BG})`;
  const edge = `color-mix(in oklab, ${C_RESISTOR} 60%, #000)`;
  return (
    <g>
      {leads && <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />}
      {/* pill-shaped resistor body */}
      <rect
        x={cx - bw}
        y={cy - bh}
        width={bw * 2}
        height={bh * 2}
        rx={bh * 0.85}
        fill={body}
        stroke={edge}
        strokeWidth={1.5}
      />
      {/* colour bands (the real-resistor read) */}
      {C_BAND.map((c, i) => (
        <rect key={i} x={cx - 8 + i * 7} y={cy - bh + 2} width={3} height={bh * 2 - 4} rx={1} fill={c} />
      ))}
      {/* top-edge sheen */}
      <line
        x1={cx - bw * 0.7}
        y1={cy - bh + 2.5}
        x2={cx + bw * 0.7}
        y2={cy - bh + 2.5}
        stroke={SHEEN}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <GlyphLabel cx={cx} cy={cy} bodyH={bh} label={label} />
    </g>
  );
}

/**
 * CELL / BATTERY, one long thin plate (+) and one short thick plate (−). Pass
 * `cells` > 1 to draw a battery (repeated plate pairs). EMF label above.
 */
export function CellGlyph({
  cx,
  cy,
  half,
  live,
  label,
  cells = 1,
}: LeadGlyphProps & { cells?: number }): ReactNode {
  const n = Math.max(1, Math.round(cells));
  const gap = 7; // px between the long and short plate of a cell
  const span = n * gap * 2 - gap; // total width of all plates
  const bodyHalf = span / 2 + 2;
  const longH = 13; // + plate (long, thin)
  const shortH = 7; // − plate (short, thick)
  const plates: ReactNode[] = [];
  let x = cx - span / 2;
  for (let i = 0; i < n; i++) {
    plates.push(
      <line
        key={`l${i}`}
        x1={x}
        y1={cy - longH}
        x2={x}
        y2={cy + longH}
        stroke={C_CELL}
        strokeWidth={2}
        strokeLinecap="round"
      />,
    );
    x += gap;
    plates.push(
      <line
        key={`s${i}`}
        x1={x}
        y1={cy - shortH}
        x2={x}
        y2={cy + shortH}
        stroke={C_CELL}
        strokeWidth={4.5}
        strokeLinecap="round"
      />,
    );
    x += gap;
  }
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bodyHalf} live={live} />
      {plates}
      <GlyphLabel cx={cx} cy={cy} bodyH={longH} label={label} />
    </g>
  );
}

export interface CapacitorGlyphProps extends LeadGlyphProps {
  /** Stored charge, 0 (empty) → 1 (full). Drives the field-line count + intensity. */
  charge?: number;
  /** Leak in progress, render falling drips driven by `leakPhase`. */
  leaking?: boolean;
  /** 0..1 leak animation phase (host frame loop drives it; honours reduced-motion). */
  leakPhase?: number;
  /** Polarised (electrolytic): the negative plate is curved + a "+" marks the anode. */
  polarised?: boolean;
}

/**
 * CAPACITOR, two parallel plates with a visible STORED-CHARGE field between them
 * and an optional LEAK. `charge` (0..1) sets how many field lines bridge the plates
 * and their intensity; `leaking` + `leakPhase` drip charge off the lower plate. All
 * motion is data, the lab's RC integrator lowers `charge` and advances `leakPhase`.
 */
export function CapacitorGlyph({
  cx,
  cy,
  half,
  live,
  label,
  charge = 0,
  leaking,
  leakPhase = 0,
  polarised,
}: CapacitorGlyphProps): ReactNode {
  const q = Math.max(0, Math.min(1, charge));
  const plateGap = 14; // px between plates (wide enough to read the field)
  const plateH = 18; // plate half-height
  const bodyHalf = plateGap / 2 + 3;
  const lx = cx - plateGap / 2; // left (+) plate x
  const rx = cx + plateGap / 2; // right (−) plate x

  const lines = q > 0.02 ? Math.round(1 + q * 2) : 0;
  const field: ReactNode[] = [];
  for (let i = 0; i < lines; i++) {
    const fy = cy - plateH * 0.5 + plateH * (lines === 1 ? 0.5 : i / (lines - 1));
    field.push(
      <line
        key={`f${i}`}
        x1={lx + 2}
        y1={fy}
        x2={rx - 2}
        y2={fy}
        stroke={CHARGE}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.12 + 0.3 * q}
      />,
    );
  }

  const drips: ReactNode[] = [];
  if (leaking && q > 0.02) {
    for (let d = 0; d < 2; d++) {
      const ph = (leakPhase + d * 0.5) % 1;
      const dy = cy + plateH + ph * 16;
      drips.push(
        <circle key={`d${d}`} cx={cx} cy={dy} r={2.2} fill={CHARGE} opacity={(1 - ph) * (0.3 + 0.5 * q)} />,
      );
    }
  }

  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bodyHalf} live={live} />
      {q > 0.02 && (
        <rect
          x={lx + 1}
          y={cy - plateH}
          width={rx - lx - 2}
          height={plateH * 2}
          fill={C_CAP}
          opacity={0.12 + 0.4 * q}
          rx={1}
        />
      )}
      {field}
      <line
        x1={lx}
        y1={cy - plateH}
        x2={lx}
        y2={cy + plateH}
        stroke={C_CAP}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {polarised ? (
        <path
          d={`M ${rx} ${cy - plateH} Q ${rx + 5} ${cy} ${rx} ${cy + plateH}`}
          fill="none"
          stroke={C_CAP}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      ) : (
        <line
          x1={rx}
          y1={cy - plateH}
          x2={rx}
          y2={cy + plateH}
          stroke={C_CAP}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      )}
      {polarised && (
        <text
          x={lx - 4}
          y={cy - plateH + 2}
          fill={FG}
          fontSize={11}
          fontWeight={700}
          textAnchor="end"
          pointerEvents="none"
        >
          +
        </text>
      )}
      {drips}
      <GlyphLabel cx={cx} cy={cy} bodyH={plateH} label={label} />
    </g>
  );
}

export interface SwitchGlyphProps extends LeadGlyphProps {
  /** Lever down on the right contact (closed) vs lifted ~40° (open). */
  closed?: boolean;
}

/**
 * SWITCH (SPST), the exam-standard open/closed switch: two terminal contacts and a
 * hinged lever off the left contact. Closed → lever lies horizontal; open → lever
 * lifts ~40° and the gap is drawn in the warn/neutral colour.
 */
export function SwitchGlyph({
  cx,
  cy,
  half,
  live,
  label,
  closed,
  leads = true,
}: SwitchGlyphProps): ReactNode {
  const bw = 18; // body half-width (hinge ↔ right contact)
  const hx = cx - bw; // hinge (left contact) x
  const tx = cx + bw; // right contact x
  const len = bw * 2; // lever length
  const ang = closed ? 0 : -40 * (Math.PI / 180);
  const ex = hx + len * Math.cos(ang); // lever free-end x
  const ey = cy + len * Math.sin(ang); // lever free-end y (up = negative)
  const lever = closed ? C_SWITCH : 'var(--stage-warn)';
  const bodyH = closed ? 4 : len * Math.sin(-ang) + 4;
  return (
    <g>
      {leads && <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />}
      <circle cx={hx} cy={cy} r={3.4} fill={C_SWITCH} />
      <circle cx={tx} cy={cy} r={3.4} fill={C_SWITCH} />
      <line x1={hx} y1={cy} x2={ex} y2={ey} stroke={lever} strokeWidth={3.6} strokeLinecap="round" />
      <line
        x1={hx}
        y1={cy - 1.4}
        x2={ex}
        y2={ey - 1.4}
        stroke={SHEEN}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <GlyphLabel cx={cx} cy={cy} bodyH={bodyH} label={label} />
    </g>
  );
}

export interface BulbGlyphProps extends LeadGlyphProps {
  /** Filament brightness, 0 (dark) → 1 (fully lit). Scales the glow halo + cross intensity. */
  brightness?: number;
  /** Draw the terminal leads (default true). Pass false when the lab draws its own wires
   *  and only needs the bulb face (e.g. a scene that routes wires separately). */
  leads?: boolean;
}

/** IEC-style indicator lamp. The crossed filament is intentionally schematic: it stays
 * legible at small sizes and cannot be confused with a resistor or inductor. State is
 * communicated by the restrained halo and active colour, never by changing the symbol. */
export function BulbGlyph({
  cx,
  cy,
  half,
  live,
  label,
  brightness = 0,
  leads = true,
}: BulbGlyphProps): ReactNode {
  const r = 16; // glass radius == bodyHalf
  const b = Math.max(0, Math.min(1, brightness));
  const lit = live && b > 0.02;
  const ring = lit ? C_LAMP : METAL;
  const filament = lit ? C_LAMP : METAL;
  return (
    <g>
      {lit && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={r + 3 + b * 5}
            fill="var(--stage-warn)"
            opacity={0.08 + 0.14 * b}
            pointerEvents="none"
          />
        </>
      )}
      {leads && <Leads cx={cx} cy={cy} half={half} bodyHalf={r} live={live} />}
      <circle cx={cx} cy={cy} r={r} fill={lit ? tint(C_LAMP, 9) : BG} stroke={ring} strokeWidth={2} />
      <path
        d={`M ${cx - 7} ${cy - 7} L ${cx + 7} ${cy + 7} M ${cx + 7} ${cy - 7} L ${cx - 7} ${cy + 7}`}
        fill="none"
        stroke={filament}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <GlyphLabel cx={cx} cy={cy} bodyH={r} label={label} />
    </g>
  );
}

export interface RheostatGlyphProps extends LeadGlyphProps {
  /** Wiper position 0..1 nudges the arrowhead along the diagonal (0 = lower-left, 1 = upper-right). */
  wiper?: number;
}

/**
 * RHEOSTAT / VARIABLE RESISTOR, the ResistorGlyph rectangle crossed by a single
 * diagonal arrow; `wiper` (0..1) slides the arrowhead along that diagonal.
 */
export function RheostatGlyph({ cx, cy, half, live, label, wiper = 0.5 }: RheostatGlyphProps): ReactNode {
  const bw = 21; // body half-width  (matches ResistorGlyph)
  const bh = 10; // body half-height (matches ResistorGlyph)
  const stroke = live ? LIVE : METAL;

  const ext = 7;
  const x0 = cx - bw - ext,
    y0 = cy + bh + ext; // lower-left tail
  const x1 = cx + bw + ext,
    y1 = cy - bh - ext; // upper-right head
  const t = 0.78 + Math.max(0, Math.min(1, wiper)) * 0.22; // wiper nudges head along diagonal
  const hx = x0 + (x1 - x0) * t;
  const hy = y0 + (y1 - y0) * t;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len,
    uy = (y1 - y0) / len;
  const ah = 7; // arrowhead length
  const aw = 4; // arrowhead half-width
  const px = -uy,
    py = ux;
  const bxx = hx - ux * ah,
    byy = hy - uy * ah;

  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />
      <rect
        x={cx - bw}
        y={cy - bh}
        width={bw * 2}
        height={bh * 2}
        rx={3}
        fill={BG}
        stroke={stroke}
        strokeWidth={2}
      />
      <line
        x1={cx - bw * 0.7}
        y1={cy - bh + 1.5}
        x2={cx + bw * 0.7}
        y2={cy - bh + 1.5}
        stroke={SHEEN}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line x1={x0} y1={y0} x2={hx} y2={hy} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
      <path
        d={`M ${hx} ${hy} L ${bxx + px * aw} ${byy + py * aw} L ${bxx - px * aw} ${byy - py * aw} Z`}
        fill={stroke}
        stroke={stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <GlyphLabel cx={cx} cy={cy} bodyH={bh} label={label} />
    </g>
  );
}
