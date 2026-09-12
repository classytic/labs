'use client';

/**
 * Meter symbols: Ammeter (A, in series) and Voltmeter (V, in parallel) — matched
 * circle-on-wire glyphs on the shared authoring contract (see ./index.ts).
 */

import type { ReactNode } from 'react';
import { Leads, GlyphLabel, LIVE, METAL, BG, FG, SHEEN, type LeadGlyphProps } from './_shared.js';

export interface AmmeterGlyphProps extends LeadGlyphProps {
  /** Measured current shown as the label above (e.g. "0.5 A"). Falls back to `label`. */
  reading?: string;
}

/**
 * AMMETER, a circle on the wire with a centered "A". Energised circle picks up the
 * live colour; the `reading` (e.g. "0.5 A") sits above the body as the value label.
 */
export function AmmeterGlyph({ cx, cy, half, live, label, reading }: AmmeterGlyphProps): ReactNode {
  const r = 17; // body radius ≈ bodyHalf
  const ring = live ? LIVE : METAL;
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={r} live={live} />
      <circle cx={cx} cy={cy} r={r} fill={BG} stroke={ring} strokeWidth={2} />
      <path
        d={`M ${cx - r * 0.6} ${cy - r * 0.45} A ${r} ${r} 0 0 1 ${cx + r * 0.6} ${cy - r * 0.45}`}
        fill="none"
        stroke={SHEEN}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy}
        fill={ring}
        fontSize={16}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        pointerEvents="none"
      >
        A
      </text>
      <GlyphLabel cx={cx} cy={cy} bodyH={r} label={reading ?? label} />
    </g>
  );
}

/**
 * VOLTMETER, a circle interrupting the wire with a centered "V" (connected in
 * parallel). Matched pair with AmmeterGlyph (identical body; only the letter differs).
 */
export function VoltmeterGlyph({ cx, cy, half, live, label }: LeadGlyphProps): ReactNode {
  const r = 16; // meter circle radius (body half-width)
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={r} live={live} />
      <circle cx={cx} cy={cy} r={r} fill={BG} stroke={live ? LIVE : METAL} strokeWidth={2} />
      <path
        d={`M ${cx - r * 0.62} ${cy - r * 0.62} A ${r} ${r} 0 0 1 ${cx + r * 0.62} ${cy - r * 0.62}`}
        fill="none"
        stroke={SHEEN}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy}
        fill={FG}
        fontSize={15}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
        pointerEvents="none"
      >
        V
      </text>
      <GlyphLabel cx={cx} cy={cy} bodyH={r} label={label} />
    </g>
  );
}
