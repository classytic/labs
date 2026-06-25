'use client';

/**
 * ScaleFrame — the shared, polished two-pan balance apparatus. Used by math
 * (`mystery-bucket`, `balance-algebra`) AND commerce (`equation-balance`), so it
 * lives in the shared `kit/` (single source of truth) — domains never import each
 * other for it. A glossy metal beam on a tapered column + domed base, with shallow
 * bowl pans hung on rigid stirrups. Theme-aware: every tint derives from
 * `--stage-metal` / `--stage-sheen` / `--stage-good`. Pure renderer — the caller
 * owns the tilt geometry + draws the pan contents (weights / coins / x-tiles).
 */

import type { ReactNode } from 'react';
import { useCoords, type Vec2 } from '@classytic/stage';

const METAL = 'var(--stage-metal)';
const GRAD = 'url(#stage-grad-metal)';
const EDGE = 'color-mix(in oklab, var(--stage-metal) 60%, black)';
const SHEEN = 'color-mix(in oklab, var(--stage-sheen) 70%, transparent)';
const SHADE = 'color-mix(in oklab, var(--stage-metal) 62%, black)';
const GOOD = 'var(--stage-good)';

/** A solid rectangular bar (metal rod) between two points — reads as a rigid
 *  strut, not a string. Returns an SVG path for a filled quad of width `w`. */
function barPath(x1: number, y1: number, x2: number, y2: number, w: number): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  return `M ${x1 + nx} ${y1 + ny} L ${x2 + nx} ${y2 + ny} L ${x2 - nx} ${y2 - ny} L ${x1 - nx} ${y1 - ny} Z`;
}

export interface ScaleFrameProps {
  pivot: Vec2;
  beamA: Vec2;
  beamB: Vec2;
  trayLC: Vec2;
  trayRC: Vec2;
  /** math y of the base/foot line. */
  baseY: number;
  /** pan radius in math units. */
  panR: number;
  balanced: boolean;
}

export function ScaleFrame({ pivot, beamA, beamB, trayLC, trayRC, baseY, panR, balanced }: ScaleFrameProps): ReactNode {
  const c = useCoords();
  const P = (v: Vec2): [number, number] => c.toPx(v.x, v.y);

  const [pivx, pivy] = P(pivot);
  const [bax, bay] = P(beamA);
  const [bbx, bby] = P(beamB);
  const [, basey] = P({ x: pivot.x, y: baseY });
  const beamAngle = (Math.atan2(bby - bay, bbx - bax) * 180) / Math.PI;
  const beamLen = Math.hypot(bbx - bax, bby - bay);
  const rxPan = c.sx(panR);

  const beamH = 13;
  const halfW = beamLen / 2 + 7;
  const colTopHalf = 7;
  const colBotHalf = 12;
  const baseRx = Math.max(30, colBotHalf * 2.6);

  // a shallow bowl pan centred at (cx, cy), held from the beam end (ex, ey) by a
  // RIGID stirrup yoke — two solid metal struts to the rim with pivot joints
  // (a mechanical holder, not a hanging cord).
  const Pan = ({ cx, cy, ex, ey, k }: { cx: number; cy: number; ex: number; ey: number; k: string }): ReactNode => {
    const ry = rxPan * 0.24;       // rim ellipse half-height
    const depth = rxPan * 0.5;     // how deep the dish drops
    const rimL = cx - rxPan * 0.66;
    const rimR = cx + rxPan * 0.66;
    const body = `M ${cx - rxPan} ${cy} C ${cx - rxPan} ${cy + depth * 0.95} ${cx - rxPan * 0.5} ${cy + depth} ${cx} ${cy + depth} C ${cx + rxPan * 0.5} ${cy + depth} ${cx + rxPan} ${cy + depth * 0.95} ${cx + rxPan} ${cy} Z`;
    return (
      <g key={k}>
        {/* rigid stirrup struts (solid bars) */}
        <path d={barPath(ex, ey, rimL, cy, 3.6)} fill={GRAD} stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round" />
        <path d={barPath(ex, ey, rimR, cy, 3.6)} fill={GRAD} stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round" />
        {/* dish body */}
        <path d={body} fill={GRAD} stroke={EDGE} strokeWidth={0.9} strokeLinejoin="round" />
        {/* opening cavity (back rim) */}
        <ellipse cx={cx} cy={cy} rx={rxPan} ry={ry} fill={SHADE} stroke={EDGE} strokeWidth={0.75} />
        {/* rim front highlight */}
        <path d={`M ${cx - rxPan} ${cy} A ${rxPan} ${ry} 0 0 0 ${cx + rxPan} ${cy}`} fill="none" stroke={SHEEN} strokeWidth={1.4} strokeLinecap="round" />
        {/* mechanical pivot joints: top yoke pin + two rim pins */}
        <circle cx={rimL} cy={cy} r={2.7} fill={GRAD} stroke={EDGE} strokeWidth={0.7} />
        <circle cx={rimR} cy={cy} r={2.7} fill={GRAD} stroke={EDGE} strokeWidth={0.7} />
        <circle cx={ex} cy={ey} r={3.8} fill={GRAD} stroke={EDGE} strokeWidth={0.9} />
        <circle cx={ex - 1.2} cy={ey - 1.3} r={1.3} fill={SHEEN} />
      </g>
    );
  };

  return (
    <g>
      {/* ── fulcrum: domed base + tapered column (behind the beam) ── */}
      <ellipse cx={pivx} cy={basey} rx={baseRx} ry={9} fill={GRAD} stroke={EDGE} strokeWidth={0.9} />
      <ellipse cx={pivx} cy={basey - 4} rx={baseRx * 0.62} ry={6} fill={GRAD} stroke={EDGE} strokeWidth={0.75} />
      <path
        d={`M ${pivx - colTopHalf} ${pivy} L ${pivx + colTopHalf} ${pivy} L ${pivx + colBotHalf} ${basey - 3} Q ${pivx + colBotHalf} ${basey} ${pivx + colBotHalf - 3} ${basey} L ${pivx - colBotHalf + 3} ${basey} Q ${pivx - colBotHalf} ${basey} ${pivx - colBotHalf} ${basey - 3} Z`}
        fill={GRAD}
        stroke={EDGE}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      {/* column left-edge sheen */}
      <line x1={pivx - colTopHalf + 2} y1={pivy + 2} x2={pivx - colBotHalf + 3} y2={basey - 3} stroke={SHEEN} strokeWidth={1.3} strokeLinecap="round" />

      {/* ── pans (hang from the rotated beam ends) ── */}
      <Pan cx={P(trayLC)[0]} cy={P(trayLC)[1]} ex={bax} ey={bay} k="L" />
      <Pan cx={P(trayRC)[0]} cy={P(trayRC)[1]} ex={bbx} ey={bby} k="R" />

      {/* ── beam (glossy rounded bar, rotated about the pivot) ── */}
      <g transform={`rotate(${beamAngle} ${pivx} ${pivy})`}>
        {balanced && <rect x={pivx - halfW - 3} y={pivy - beamH / 2 - 3} width={halfW * 2 + 6} height={beamH + 6} rx={(beamH + 6) / 2} fill={GOOD} opacity={0.18} />}
        <rect x={pivx - halfW} y={pivy - beamH / 2} width={halfW * 2} height={beamH} rx={beamH / 2} fill={balanced ? GOOD : GRAD} stroke={EDGE} strokeWidth={0.9} />
        <rect x={pivx - halfW + 4} y={pivy - beamH / 2 + 1.5} width={halfW * 2 - 8} height={2.4} rx={1.2} fill={SHEEN} />
      </g>

      {/* end knobs + pivot ball with a specular dot */}
      <circle cx={bax} cy={bay} r={4} fill={balanced ? GOOD : GRAD} stroke={EDGE} strokeWidth={0.9} />
      <circle cx={bbx} cy={bby} r={4} fill={balanced ? GOOD : GRAD} stroke={EDGE} strokeWidth={0.9} />
      <circle cx={pivx} cy={pivy} r={7.5} fill={GRAD} stroke={EDGE} strokeWidth={1} />
      <circle cx={pivx - 2.2} cy={pivy - 2.4} r={2} fill={SHEEN} />
    </g>
  );
}
