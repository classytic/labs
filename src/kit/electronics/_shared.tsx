'use client';

/**
 * Shared building blocks for the electronics glyph vocabulary: the colour token
 * constants, the two-terminal `Leads`, the haloed `Tag` label, the `GlyphLabel`
 * helper, and the `tint` shade helper. Every glyph module imports from here so the
 * authoring contract (tokens, centered terminals, haloed labels) stays one source
 * of truth. See ./index.ts for the full contract doc.
 */

import type { ReactNode } from 'react';

/** Common props for a two-terminal device glyph. `half` = px center→terminal. */
export interface LeadGlyphProps {
  cx: number;
  cy: number;
  half: number;
  /** Energised (current flowing) → leads + symbol pick up the live colour. */
  live?: boolean;
  /** Value / name shown above the body (e.g. "220Ω", "10µF", "A"). */
  label?: string;
  /** Draw the terminal leads (default true). false = bulb/resistor face only, for a lab
   *  that routes its own wires and just drops the symbol on top. */
  leads?: boolean;
}

export const WIRE = 'var(--stage-wire)';
// Energised path = the ACCENT colour (not green). Green (--stage-good) is reserved for a
// VALID / completed state (feedback), so "current flows here" and "this is correct" read
// as different things instead of the whole circuit going one bright green.
export const LIVE = 'var(--stage-accent)';
export const METAL = 'var(--stage-metal)';
export const DANGER = 'var(--stage-danger, oklch(0.58 0.19 25))';
export const WARN = 'var(--stage-warn, oklch(0.72 0.14 75))';
export const BG = 'var(--stage-bg)';
export const FG = 'var(--stage-fg)';
export const CHARGE = 'var(--stage-charge)';
export const SHEEN = 'color-mix(in oklab, var(--stage-sheen) 45%, transparent)';

// Per-device SIGNATURE colours (token + a tasteful oklch fallback) so each part reads
// as itself, not a uniform grey. Real-object inspired: tan resistor, teal cap, violet
// diode, green cell, amber lamp, indigo MOSFET. Body picks up the colour; the leads
// still go LIVE when current flows, so energised state stays legible too.
// green is reserved for the energised wires/flow, so no component uses it.
export const C_RESISTOR = 'var(--stage-resistor, oklch(0.74 0.09 70))'; // tan / beige body
export const C_CAP = 'var(--stage-capacitor, oklch(0.6 0.14 250))'; // blue
export const C_DIODE = 'var(--stage-diode, oklch(0.56 0.16 290))'; // violet
export const C_CELL = 'var(--stage-cell, oklch(0.58 0.18 28))'; // red / vermilion
export const C_LAMP = 'var(--stage-warn, oklch(0.78 0.15 75))'; // amber glass
export const C_SWITCH = 'var(--stage-switch, oklch(0.6 0.04 250))'; // slate
export const C_MOS = 'var(--stage-mosfet, oklch(0.57 0.13 300))'; // magenta-indigo
export const C_BAND = ['oklch(0.45 0.08 50)', 'oklch(0.55 0.18 28)', 'oklch(0.6 0.15 75)']; // resistor colour bands
export const tint = (c: string, pct = 12): string => `color-mix(in oklab, ${c} ${pct}%, ${BG})`;

/** The two clean leads from each terminal to the body edge at ±bodyHalf (no nubs, no bloat). */
export function Leads({
  cx,
  cy,
  half,
  bodyHalf,
  live,
}: {
  cx: number;
  cy: number;
  half: number;
  bodyHalf: number;
  live?: boolean;
}): ReactNode {
  const wire = live ? LIVE : WIRE;
  return (
    <g>
      <line
        x1={cx - half}
        y1={cy}
        x2={cx - bodyHalf}
        y2={cy}
        stroke={wire}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line
        x1={cx + bodyHalf}
        y1={cy}
        x2={cx + half}
        y2={cy}
        stroke={wire}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}

export interface TagProps {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  /** halo colour painted UNDER the text so it stays legible over wires/lines/fills. */
  halo?: string;
}

/**
 * Tag — an SVG text label with a background HALO (a stroke in the bg colour painted under
 * the fill). ALWAYS use this instead of a bare <text> in a schematic: it keeps labels
 * readable wherever they land, so a label crossing a wire or sitting on a fill never turns
 * into mud. (This is the same paint-order trick the stage axis labels use.)
 */
export function Tag({
  x,
  y,
  text,
  color = FG,
  size = 11,
  weight = 600,
  anchor = 'middle',
  halo = BG,
}: TagProps): ReactNode {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      style={{
        pointerEvents: 'none',
        paintOrder: 'stroke',
        stroke: halo,
        strokeWidth: 3.5,
        strokeLinejoin: 'round',
      }}
    >
      {text}
    </text>
  );
}

/** Value/name label above a body of half-height `bodyH` (haloed via Tag). */
export function GlyphLabel({
  cx,
  cy,
  bodyH,
  label,
}: {
  cx: number;
  cy: number;
  bodyH: number;
  label?: string;
}): ReactNode {
  if (!label) return null;
  return <Tag x={cx} y={cy - bodyH - 7} text={label} />;
}
