'use client';

/**
 * Illustrative (non-schematic) electronics icons for hero / analogy contexts:
 * a real-object filament LampGlyph and an AC/DC source, with thermal glow + bloom
 * from the shared stage <defs>. Use these when the ENGAGING glyph fits the lesson,
 * the exam-standard schematic symbols live in the sibling modules.
 */

import type { ReactNode } from 'react';
import { figUrl, useFigureId } from '../figure/index.js';

export function LampGlyph({
  cx,
  cy,
  brightness,
  r = 30,
}: {
  cx: number;
  cy: number;
  brightness: number;
  r?: number;
}): ReactNode {
  const uid = useFigureId();
  const b = Math.max(0, Math.min(1, brightness));
  const hot = b > 0.04;
  // filament colour: cool metal at b=0 → warm at b=1 (cross-fade via color-mix %)
  const filament = `color-mix(in oklab, var(--stage-metal) ${Math.round((1 - b) * 100)}%, var(--stage-warn))`;
  return (
    <g>
      {/* Warm halo: a single radial that fades ALL the way to transparent, so there is no
          hard disc edge (the old thermal gradient floored at 40% opacity, then a Gaussian
          blur smeared that hard rim into a muddy band). Brightness drives reach + opacity;
          no blur filter needed — a clean radial reads as emitted light on its own. */}
      {hot && (
        <>
          <defs>
            <radialGradient id={`${uid}-lamp-halo`} cx="0.5" cy="0.5" r="0.5">
              <stop
                offset="0"
                stopColor="color-mix(in oklab, white 55%, var(--stage-warn))"
                stopOpacity={0.85}
              />
              <stop offset="0.35" stopColor="var(--stage-warn)" stopOpacity={0.5} />
              <stop offset="0.7" stopColor="var(--stage-warn)" stopOpacity={0.16} />
              <stop offset="1" stopColor="var(--stage-warn)" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={r + 3 + b * 18}
            fill={figUrl(uid, 'lamp-halo')}
            opacity={0.32 + 0.5 * b}
            pointerEvents="none"
          />
        </>
      )}
      {/* glass envelope */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--stage-bg)"
        stroke={hot ? 'var(--stage-warn)' : 'var(--stage-metal)'}
        strokeWidth={2.5}
      />
      {/* coil filament */}
      <path
        d={`M ${cx - 16} ${cy + 6} q 4 -16 8 0 q 4 16 8 0 q 4 -16 8 0 q 4 16 8 0`}
        fill="none"
        stroke={filament}
        strokeWidth={hot ? 3 : 2.2}
        strokeLinecap="round"
        filter={b > 0.55 ? 'url(#stage-bloom)' : undefined}
      />
      {/* white-hot core flash at peak output */}
      {b > 0.6 && (
        <circle
          cx={cx}
          cy={cy}
          r={6 + (b - 0.6) * 14}
          fill="white"
          opacity={(b - 0.6) * 1.6}
          filter="url(#stage-bloom)"
          pointerEvents="none"
        />
      )}
      {/* screw base */}
      <rect x={cx - 9} y={cy + r - 2} width={18} height={10} rx={2} fill="var(--stage-metal)" />
    </g>
  );
}

/** An AC (~) or DC (=) source; a halo behind it tracks output magnitude `level` (-1..1). */
export function AcDcSourceGlyph({
  cx,
  cy,
  mode,
  level,
  r = 30,
}: {
  cx: number;
  cy: number;
  mode: 'ac' | 'dc';
  level: number;
  r?: number;
}): ReactNode {
  const live = Math.abs(Math.max(-1, Math.min(1, level)));
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r + 10}
        fill="url(#stage-grad-halo)"
        opacity={0.25 + 0.6 * live}
        pointerEvents="none"
      />
      <circle cx={cx} cy={cy} r={r} fill="var(--stage-bg)" stroke="var(--stage-accent)" strokeWidth={2.5} />
      {mode === 'ac' ? (
        <path
          d={`M ${cx - 16} ${cy} q 8 -14 16 0 q 8 14 16 0`}
          fill="none"
          stroke="var(--stage-accent)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : (
        <g stroke="var(--stage-accent)" strokeLinecap="round">
          <line x1={cx - 15} y1={cy - 6} x2={cx + 15} y2={cy - 6} strokeWidth={3.5} />
          <line x1={cx - 15} y1={cy + 6} x2={cx + 15} y2={cy + 6} strokeWidth={2} strokeDasharray="4 4" />
        </g>
      )}
      {/* Beside the source, not under it: the loop's wires leave the top and bottom of the circle,
          and a label underneath sat on the wire. */}
      <text
        x={cx - r - 12}
        y={cy + 5}
        textAnchor="end"
        fontSize={13}
        fontWeight={700}
        fill="var(--stage-accent)"
      >
        {mode.toUpperCase()}
      </text>
    </g>
  );
}
