'use client';

/**
 * Game-show glyph kit — the "make a choice, open the reveal" vocabulary: a DOOR
 * that swings open to show what's behind it, plus a CAR (the prize) and a GOAT
 * (the booby prize) to live behind it. Drawn in PIXEL space, token-coloured, pure
 * SVG. The door's `open` (0→1) animates via an inline CSS transition on the leaf
 * (transform-origin left, swinging aside) so the host just flips the prop. Used by
 * the Monty Hall lab, reusable for any pick-a-box / reveal interaction.
 */

import type { ReactNode } from 'react';

const FG = 'var(--stage-fg)';
const BG = 'var(--stage-bg)';
const METAL = 'var(--stage-metal)';
const ACCENT = 'var(--stage-accent)';
const GOLD = 'var(--stage-warn)';
const GOOD = 'var(--stage-good)';
const MUTED = 'var(--stage-muted)';
const SHEEN = 'color-mix(in oklab, var(--stage-sheen, white) 55%, transparent)';
// NOTE: keep color-mix percentages summing to 100% — a smaller sum leaks alpha
// (the remainder becomes transparency), which would make the closed door see-through.
const LEAF = 'color-mix(in oklab, var(--stage-accent) 92%, black)';
const RECESS = 'color-mix(in oklab, var(--stage-fg) 88%, var(--stage-bg))';

/** A game-show door in box (x,y,w,h). `open` 0→1 swings the leaf aside to reveal
 *  `children` (the prize/goat drawn behind). `picked` rings it; `dim` greys it. */
export function DoorGlyph({ x, y, w, h, label, open = 0, picked = false, dim = false, children }: {
  x: number; y: number; w: number; h: number; label?: string | number; open?: number; picked?: boolean; dim?: boolean; children?: ReactNode;
}): ReactNode {
  const r = Math.min(12, w * 0.12);
  const inset = Math.max(4, w * 0.06);
  const ix = x + inset, iy = y + inset, iw = w - inset * 2, ih = h - inset * 2;
  return (
    <g opacity={dim ? 0.45 : 1}>
      {/* frame */}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={METAL} />
      <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={r - 1} fill="none" stroke={SHEEN} strokeWidth={1} opacity={0.4} />
      {/* dark interior recess + whatever is behind the door */}
      <clipPath id={`door-clip-${label ?? ''}-${x}-${y}`}><rect x={ix} y={iy} width={iw} height={ih} rx={r * 0.6} /></clipPath>
      <g clipPath={`url(#door-clip-${label ?? ''}-${x}-${y})`}>
        <rect x={ix} y={iy} width={iw} height={ih} rx={r * 0.6} fill={RECESS} />
        <rect x={ix} y={iy} width={iw} height={ih * 0.5} fill="color-mix(in oklab, black 16%, transparent)" />
        {children}
      </g>
      {/* the door leaf — swings aside as `open` → 1 */}
      <g style={{ transform: `scaleX(${Math.max(0.04, 1 - open)})`, transformOrigin: `${ix}px ${iy + ih / 2}px`, transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)' }}>
        <rect x={ix} y={iy} width={iw} height={ih} rx={r * 0.6} fill={LEAF} />
        {/* two recessed panels */}
        <rect x={ix + iw * 0.16} y={iy + ih * 0.08} width={iw * 0.68} height={ih * 0.42} rx={4} fill="none" stroke="color-mix(in oklab, black 22%, transparent)" strokeWidth={2} />
        <rect x={ix + iw * 0.16} y={iy + ih * 0.54} width={iw * 0.68} height={ih * 0.36} rx={4} fill="none" stroke="color-mix(in oklab, black 22%, transparent)" strokeWidth={2} />
        <path d={`M${ix + iw * 0.5},${iy + 2} V${iy + ih - 2}`} stroke={SHEEN} strokeWidth={1} opacity={0.3} />
        {/* handle */}
        <circle cx={ix + iw * 0.84} cy={iy + ih * 0.52} r={Math.max(3, w * 0.05)} fill={GOLD} stroke="color-mix(in oklab, black 25%, transparent)" strokeWidth={1} />
        {/* number badge */}
        {label != null && (
          <>
            <circle cx={ix + iw * 0.5} cy={iy + ih * 0.3} r={Math.max(11, w * 0.16)} fill={GOLD} />
            <text x={ix + iw * 0.5} y={iy + ih * 0.3} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(13, w * 0.2)} fontWeight={800} fill="color-mix(in oklab, black 70%, var(--stage-warn))">{label}</text>
          </>
        )}
      </g>
      {/* picked ring */}
      {picked && <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={r + 3} fill="none" stroke={GOOD} strokeWidth={3.5} />}
    </g>
  );
}

/** The prize — a shiny car (side view) in box (x,y,w,h). */
export function CarGlyph({ x, y, w, h }: { x: number; y: number; w: number; h: number }): ReactNode {
  const X = (f: number): number => x + w * f, Y = (f: number): number => y + h * f;
  const edge = 'color-mix(in oklab, var(--stage-warn) 55%, black)';
  const wheelR = h * 0.15, wy = Y(0.8);
  return (
    <g>
      {/* one-piece body + cabin silhouette */}
      <path d={`M${X(0.06)},${Y(0.66)}
        Q${X(0.06)},${Y(0.5)} ${X(0.16)},${Y(0.48)}
        L${X(0.3)},${Y(0.46)}
        Q${X(0.36)},${Y(0.26)} ${X(0.5)},${Y(0.26)}
        L${X(0.64)},${Y(0.27)}
        Q${X(0.72)},${Y(0.3)} ${X(0.78)},${Y(0.47)}
        L${X(0.9)},${Y(0.5)}
        Q${X(0.96)},${Y(0.52)} ${X(0.96)},${Y(0.66)}
        L${X(0.94)},${Y(0.72)} L${X(0.06)},${Y(0.72)} Z`}
        fill={GOLD} stroke={edge} strokeWidth={Math.max(1.5, w * 0.018)} strokeLinejoin="round" />
      {/* windows */}
      <path d={`M${X(0.34)},${Y(0.45)} Q${X(0.39)},${Y(0.31)} ${X(0.49)},${Y(0.31)} L${X(0.49)},${Y(0.45)} Z`} fill="color-mix(in oklab, var(--stage-bg) 70%, var(--stage-fg))" opacity={0.85} />
      <path d={`M${X(0.52)},${Y(0.31)} L${X(0.62)},${Y(0.32)} Q${X(0.67)},${Y(0.34)} ${X(0.71)},${Y(0.45)} L${X(0.52)},${Y(0.45)} Z`} fill="color-mix(in oklab, var(--stage-bg) 70%, var(--stage-fg))" opacity={0.85} />
      {/* body sheen */}
      <path d={`M${X(0.14)},${Y(0.56)} L${X(0.86)},${Y(0.56)}`} stroke={SHEEN} strokeWidth={h * 0.03} strokeLinecap="round" opacity={0.55} />
      {/* headlight + wheels */}
      <circle cx={X(0.92)} cy={Y(0.6)} r={h * 0.035} fill="white" />
      {[0.28, 0.72].map((f) => (
        <g key={f}>
          <circle cx={X(f)} cy={wy} r={wheelR} fill="color-mix(in oklab, var(--stage-fg) 88%, black)" />
          <circle cx={X(f)} cy={wy} r={wheelR * 0.5} fill={METAL} />
          <circle cx={X(f)} cy={wy} r={wheelR * 0.16} fill={FG} />
        </g>
      ))}
    </g>
  );
}

/** The booby prize — a goat head in box (x,y,w,h). Big swept horns + beard so it
 *  reads as a goat, not a mouse. */
export function GoatGlyph({ x, y, w, h }: { x: number; y: number; w: number; h: number }): ReactNode {
  const X = (f: number): number => x + w * f, Y = (f: number): number => y + h * f;
  const fur = 'color-mix(in oklab, var(--stage-muted) 80%, var(--stage-bg))';
  const dark = 'color-mix(in oklab, var(--stage-muted) 45%, black)';
  const horn = 'color-mix(in oklab, var(--stage-muted) 30%, black)';
  const hw = Math.max(4, w * 0.07);
  return (
    <g>
      {/* big curved horns sweeping up and back — the goat tell */}
      <path d={`M${X(0.4)},${Y(0.28)} C${X(0.3)},${Y(0.16)} ${X(0.18)},${Y(0.1)} ${X(0.1)},${Y(0.16)}`} fill="none" stroke={horn} strokeWidth={hw} strokeLinecap="round" />
      <path d={`M${X(0.6)},${Y(0.28)} C${X(0.7)},${Y(0.16)} ${X(0.82)},${Y(0.1)} ${X(0.9)},${Y(0.16)}`} fill="none" stroke={horn} strokeWidth={hw} strokeLinecap="round" />
      {/* floppy ears */}
      <path d={`M${X(0.3)},${Y(0.4)} Q${X(0.12)},${Y(0.46)} ${X(0.16)},${Y(0.6)} Q${X(0.28)},${Y(0.56)} ${X(0.34)},${Y(0.48)} Z`} fill={dark} />
      <path d={`M${X(0.7)},${Y(0.4)} Q${X(0.88)},${Y(0.46)} ${X(0.84)},${Y(0.6)} Q${X(0.72)},${Y(0.56)} ${X(0.66)},${Y(0.48)} Z`} fill={dark} />
      {/* long face tapering to a muzzle */}
      <path d={`M${X(0.36)},${Y(0.34)} Q${X(0.5)},${Y(0.28)} ${X(0.64)},${Y(0.34)} L${X(0.6)},${Y(0.74)} Q${X(0.5)},${Y(0.86)} ${X(0.4)},${Y(0.74)} Z`} fill={fur} stroke={dark} strokeWidth={1.5} strokeLinejoin="round" />
      {/* muzzle shading */}
      <ellipse cx={X(0.5)} cy={Y(0.7)} rx={w * 0.1} ry={h * 0.08} fill={dark} opacity={0.35} />
      {/* eyes (with rectangular goat pupils) */}
      <ellipse cx={X(0.43)} cy={Y(0.48)} rx={w * 0.045} ry={h * 0.035} fill="white" />
      <ellipse cx={X(0.57)} cy={Y(0.48)} rx={w * 0.045} ry={h * 0.035} fill="white" />
      <rect x={X(0.43) - w * 0.03} y={Y(0.48) - h * 0.008} width={w * 0.06} height={h * 0.016} rx={1} fill={FG} />
      <rect x={X(0.57) - w * 0.03} y={Y(0.48) - h * 0.008} width={w * 0.06} height={h * 0.016} rx={1} fill={FG} />
      {/* nostrils */}
      <circle cx={X(0.46)} cy={Y(0.71)} r={Math.max(1.2, w * 0.018)} fill={dark} />
      <circle cx={X(0.54)} cy={Y(0.71)} r={Math.max(1.2, w * 0.018)} fill={dark} />
      {/* beard tuft */}
      <path d={`M${X(0.42)},${Y(0.8)} Q${X(0.5)},${Y(1.02)} ${X(0.58)},${Y(0.8)} Q${X(0.5)},${Y(0.88)} ${X(0.42)},${Y(0.8)} Z`} fill={fur} stroke={dark} strokeWidth={1} />
    </g>
  );
}
